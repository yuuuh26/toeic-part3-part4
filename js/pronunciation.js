const contractions=[
  [/\bi'm\b/g,'i am'],[/\byou're\b/g,'you are'],[/\bwe're\b/g,'we are'],[/\bthey're\b/g,'they are'],
  [/\bit's\b/g,'it is'],[/\bthat's\b/g,'that is'],[/\bthere's\b/g,'there is'],[/\bwhat's\b/g,'what is'],
  [/\bi've\b/g,'i have'],[/\byou've\b/g,'you have'],[/\bwe've\b/g,'we have'],[/\bthey've\b/g,'they have'],
  [/\bi'll\b/g,'i will'],[/\byou'll\b/g,'you will'],[/\bwe'll\b/g,'we will'],[/\bthey'll\b/g,'they will'],
  [/\bcan't\b/g,'cannot'],[/\bwon't\b/g,'will not'],[/\bdon't\b/g,'do not'],[/\bdoesn't\b/g,'does not'],
  [/\bdidn't\b/g,'did not'],[/\bisn't\b/g,'is not'],[/\baren't\b/g,'are not'],[/\bwasn't\b/g,'was not'],
  [/\bweren't\b/g,'were not'],[/\bhaven't\b/g,'have not'],[/\bhasn't\b/g,'has not'],[/\bhadn't\b/g,'had not'],
  [/\bwouldn't\b/g,'would not'],[/\bcouldn't\b/g,'could not'],[/\bshouldn't\b/g,'should not'],[/\blet's\b/g,'let us']
];

export function normalizeSpeech(text){
  let s=String(text??'').toLowerCase().replace(/[’‘]/g,"'").normalize('NFKD');
  for(const [pattern,replacement] of contractions)s=s.replace(pattern,replacement);
  return s.replace(/[^a-z0-9\s']/g,' ').replace(/'/g,'').replace(/\s+/g,' ').trim();
}

function editDistance(a,b){
  const prev=Array.from({length:b.length+1},(_,i)=>i),cur=new Array(b.length+1);
  for(let i=1;i<=a.length;i++){
    cur[0]=i;
    for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    for(let j=0;j<=b.length;j++)prev[j]=cur[j];
  }
  return prev[b.length];
}

function similarity(a,b){
  const max=Math.max(a.length,b.length);
  return max===0?1:Math.max(0,1-editDistance(a,b)/max);
}

export function scorePronunciation(target,spoken,confidence=0){
  const t=normalizeSpeech(target),s=normalizeSpeech(spoken);
  if(!t||!s)return 0;
  const wordScore=similarity(t.split(' '),s.split(' '));
  const charScore=similarity([...t.replace(/\s/g,'')],[...s.replace(/\s/g,'')]);
  const conf=Number.isFinite(confidence)&&confidence>0?Math.max(0,Math.min(1,confidence)):null;
  const base=wordScore*.82+charScore*.18;
  return Math.round(Math.max(0,Math.min(1,conf===null?base:base*.94+conf*.06))*100);
}

export function pronunciationBand(score){
  if(score>=94)return{level:'perfect',label:'PERFECT'};
  if(score>=84)return{level:'excellent',label:'EXCELLENT'};
  if(score>=72)return{level:'great',label:'GREAT'};
  if(score>=60)return{level:'good',label:'GOOD'};
  return{level:'retry',label:'TRY AGAIN'};
}

export function evaluatePronunciation(target,alternatives=[]){
  const list=alternatives.map(x=>typeof x==='string'?{transcript:x,confidence:0}:x).filter(x=>x&&x.transcript);
  if(!list.length)return{score:0,...pronunciationBand(0),transcript:'',confidence:0};
  const ranked=list.map(x=>({transcript:x.transcript,confidence:Number(x.confidence)||0,score:scorePronunciation(target,x.transcript,Number(x.confidence)||0)})).sort((a,b)=>b.score-a.score);
  const best=ranked[0];
  return{...best,...pronunciationBand(best.score)};
}
