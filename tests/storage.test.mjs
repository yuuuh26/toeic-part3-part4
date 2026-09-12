import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
// Supply the fake-indexeddb package location when running outside npm installation.
const pkg=process.env.INDEXEDDB_TEST_MODULE||'fake-indexeddb';
const {indexedDB}=await import(pkg);globalThis.indexedDB=indexedDB;
const {recordAttempt,allAnswers,getSetting,setSetting,openDB}=await import('../js/storage.js');
const p=JSON.parse(await fs.readFile(new URL('../data/part3/pack01.json',import.meta.url)));
test('retrying one save does not duplicate the attempt; reopening preserves history and settings',async()=>{const s=p.sets[0];await recordAttempt(s,[1,0,2],'attempt-1');await recordAttempt(s,[1,0,2],'attempt-1');assert.equal((await allAnswers()).length,3);await recordAttempt(s,[0,null,2],'attempt-2');assert.equal((await allAnswers()).length,6);await setSetting('preferences',{part:4,rate:.9});const db=await openDB();db.onversionchange();assert.equal((await allAnswers()).length,6);assert.deepEqual(await getSetting('preferences',null),{part:4,rate:.9});assert.equal((await allAnswers()).filter(r=>r.attemptId==='attempt-2'&&r.answer===null).length,1);});
test('adding another pack retains old question records',async()=>{const old=await allAnswers();const set=structuredClone(p.sets[0]);set.id='P3-0999';set.packId='part3-pack02';set.questions.forEach((q,i)=>q.id=`P3-0999-Q${i+1}`);await recordAttempt(set,[0,1,2],'attempt-new-pack');const now=await allAnswers();assert.equal(now.length,old.length+3);for(const r of old)assert.deepEqual(now.find(n=>n.id===r.id),r);});
