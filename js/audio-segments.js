export function detectTranscriptSegments(samples,sampleRate,texts){
  const count=texts?.length??0;
  if(!count||!samples?.length||!sampleRate)return [];
  if(count===1)return[{start:0,end:samples.length/sampleRate}];
  const frame=Math.max(64,Math.round(sampleRate*.01)),levels=[];
  for(let start=0;start<samples.length;start+=frame){
    const end=Math.min(samples.length,start+frame);let sum=0;
    for(let i=start;i<end;i++)sum+=samples[i]*samples[i];
    levels.push(Math.sqrt(sum/Math.max(1,end-start)));
  }
  const sorted=[...levels].sort((a,b)=>a-b),noise=sorted[Math.floor(sorted.length*.18)]||0;
  const threshold=Math.max(.0012,Math.min(.012,noise*3.2+.0012));
  const candidates=[];let run=-1;
  const push=endFrame=>{
    if(run<0)return;
    const duration=(endFrame-run)*frame/sampleRate;
    if(duration>=.12){
      const start=run*frame/sampleRate,end=Math.min(samples.length/sampleRate,endFrame*frame/sampleRate);
      if(start>.08&&end<samples.length/sampleRate-.05)candidates.push({start,end,mid:(start+end)/2,duration});
    }
    run=-1;
  };
  for(let i=0;i<levels.length;i++){if(levels[i]<=threshold){if(run<0)run=i;}else push(i);}
  push(levels.length);
  const total=samples.length/sampleRate,weights=texts.map(t=>Math.max(1,String(t??'').replace(/\s+/g,' ').trim().length));
  const sumWeights=weights.reduce((a,b)=>a+b,0);let cumulative=0,previous=.02;const boundaries=[];
  for(let i=0;i<count-1;i++){
    cumulative+=weights[i];const expected=total*cumulative/sumWeights,remaining=count-2-i;
    const viable=candidates.filter((c,idx)=>c.mid>previous+.18&&c.mid<total-.18&&(candidates.length-idx-1)>=remaining);
    if(!viable.length)break;
    let best=viable[0],bestCost=Infinity;
    for(const c of viable){
      const distance=Math.abs(c.mid-expected)/total;
      const durationBonus=Math.min(c.duration,.6)*.035;
      const cost=distance-durationBonus;
      if(cost<bestCost){best=c;bestCost=cost;}
    }
    boundaries.push(best.mid);previous=best.mid;
  }
  if(boundaries.length!==count-1)return[];
  return boundaries.map((end,i)=>({start:i===0?0:boundaries[i-1],end})).concat({start:boundaries.at(-1),end:total});
}


function wordCount(text){return String(text??'').trim().split(/\s+/).filter(Boolean).length;}

function splitLongSpeakingUnit(text,maxWords){
  const words=String(text??'').trim().split(/\s+/).filter(Boolean),chunks=[];
  let rest=words;
  while(rest.length>maxWords){
    let cut=maxWords;
    const lower=Math.max(4,Math.floor(maxWords*.58));
    for(let i=maxWords-1;i>=lower;i--){
      const token=rest[i]?.toLowerCase().replace(/^[("'“‘]+|[)"'”’.,;:!?]+$/g,'');
      if(/^(and|but|or|because|so|if|when|while|although|though|since|which|who|that)$/.test(token)){cut=i;break;}
    }
    if(cut<1)cut=maxWords;
    chunks.push(rest.slice(0,cut).join(' '));
    rest=rest.slice(cut);
  }
  if(rest.length){
    const tail=rest.join(' ');
    if(chunks.length&&rest.length<4&&wordCount(chunks.at(-1))+rest.length<=maxWords+3)chunks[chunks.length-1]+=' '+tail;
    else chunks.push(tail);
  }
  return chunks;
}

export function splitSpeakingChunks(text,maxWords=12){
  const sentences=String(text??'').trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(s=>s.trim()).filter(Boolean)??[];
  if(!sentences.length)return[];
  const chunks=[];
  for(const sentence of sentences){
    const clauses=sentence.match(/[^,;:]+[,;:]?|[^,;:]+$/g)?.map(s=>s.trim()).filter(Boolean)??[sentence];
    let pending='';
    const flush=()=>{if(pending){chunks.push(...splitLongSpeakingUnit(pending,maxWords));pending='';}};
    for(const clause of clauses){
      const candidate=pending?pending+' '+clause:clause;
      if(pending&&wordCount(candidate)>maxWords+2){flush();pending=clause;}
      else pending=candidate;
      if(wordCount(pending)>=maxWords)flush();
    }
    flush();
  }
  return chunks;
}
