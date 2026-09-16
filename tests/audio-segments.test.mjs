import test from 'node:test';
import assert from 'node:assert/strict';
import {detectTranscriptSegments,splitSpeakingChunks} from '../js/audio-segments.js';

function synthetic(durations,sr=1000){
  const samples=[];let phase=0;
  durations.forEach((seconds,i)=>{
    const speech=Math.round(seconds*sr);
    for(let n=0;n<speech;n++){samples.push(.18*Math.sin(phase));phase+=.31;}
    if(i<durations.length-1)for(let n=0;n<220;n++)samples.push(0);
  });
  return new Float32Array(samples);
}
test('detects transcript boundaries from inserted silence gaps',()=>{
  const sr=1000,samples=synthetic([1.1,.8,1.35],sr);
  const segments=detectTranscriptSegments(samples,sr,['one fairly long line','short line','the final longer line']);
  assert.equal(segments.length,3);
  assert(Math.abs(segments[0].end-1.21)<.12);
  assert(Math.abs(segments[1].end-2.23)<.14);
  assert(segments[2].end>3.4);
});
test('returns an empty result when boundaries cannot be resolved',()=>{
  const sr=1000,samples=new Float32Array(2500).fill(.1);
  assert.deepEqual(detectTranscriptSegments(samples,sr,['a','b','c']),[]);
});


test('speaking chunks stay within one to three sentences',()=>{
  assert.deepEqual(splitSpeakingChunks('One. Two. Three. Four.'),['One. Two.','Three. Four.']);
  assert.deepEqual(splitSpeakingChunks('One. Two. Three.'),['One. Two. Three.']);
  assert.deepEqual(splitSpeakingChunks('One.'),['One.']);
});
