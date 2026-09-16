import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSpeech,scorePronunciation,pronunciationBand,evaluatePronunciation,mergeRecognizedSpeech} from '../js/pronunciation.js';

test('pronunciation normalization absorbs common contractions and punctuation',()=>{
  assert.equal(normalizeSpeech("I'm ready, aren't you?"),'i am ready are not you');
});
test('exact and near-exact speech score highly',()=>{
  assert.equal(scorePronunciation('I am ready for the meeting.','I am ready for the meeting.',.9)>=95,true);
  assert.equal(scorePronunciation("I'm ready for the meeting.","I am ready for the meeting",.8)>=90,true);
});
test('pronunciation bands map to requested reward levels',()=>{
  assert.equal(pronunciationBand(95).label,'PERFECT');
  assert.equal(pronunciationBand(88).label,'EXCELLENT');
  assert.equal(pronunciationBand(76).label,'GREAT');
  assert.equal(pronunciationBand(64).label,'GOOD');
  assert.equal(pronunciationBand(40).label,'TRY AGAIN');
});
test('best recognition alternative is selected',()=>{
  const r=evaluatePronunciation('Please send me the updated schedule.',[
    {transcript:'Please send the schedule',confidence:.9},
    {transcript:'Please send me the updated schedule',confidence:.72}
  ]);
  assert.equal(r.label,'PERFECT');
  assert.match(r.transcript,/updated schedule/);
});


test('speech merge removes repeated and overlapping recognition text',()=>{
  assert.equal(mergeRecognizedSpeech('I need to check','check the schedule'),'I need to check the schedule');
  assert.equal(mergeRecognizedSpeech('I need to check','I need to check'),'I need to check');
  assert.equal(mergeRecognizedSpeech('I need to check','I need to check the schedule'),'I need to check the schedule');
  assert.equal(mergeRecognizedSpeech('Please send me','me the updated file'),'Please send me the updated file');
});
