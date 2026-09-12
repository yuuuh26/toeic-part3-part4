"""Validate pack identity, references and production audio. No dependencies."""
import argparse,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def validate(require_audio=True):
 c=json.loads((ROOT/'data/catalog.json').read_text());assert c['schemaVersion']==1
 ids=set();paths=set();pids=set();count=0;audio_bytes=0;durations=[]
 def local(p):
  assert not p.startswith('/') and '..' not in Path(p).parts and ':' not in p,p
  return ROOT/p
 for meta in c['packs']:
  assert meta['id'] not in pids; pids.add(meta['id'])
  p=json.loads(local(meta['path']).read_text());assert p['schemaVersion']==1 and p['id']==meta['id'];assert len(p['sets'])==meta['setCount'] and meta['questionCount']==len(p['sets'])*3
  for s in p['sets']:
   assert s['id'] not in ids;ids.add(s['id']);assert s['part']==meta['part'] and s['packId']==p['id']
   assert len(s['questions'])==3
   sp={x['id'] for x in s['speakers']};assert len(sp)==len(s['speakers']);assert all(t['speaker'] in sp and t['text'] and t['translation'] for t in s['transcript'])
   assert (s['part']==3 and 2<=len(sp)<=3) or (s['part']==4 and len(sp)==1)
   for q in s['questions']:
    assert q['id'] not in ids;ids.add(q['id']);assert len(q['options'])==4 and len(set(q['options']))==4;assert type(q['answer'])==int and 0<=q['answer']<4;assert q['explanation'] and q['text'];count+=1
   assert s['audio'] not in paths;paths.add(s['audio']);f=local(s['audio'])
   if require_audio:
    assert f.is_file(),f'Missing audio: {f}';assert f.stat().st_size>1000;audio_bytes+=f.stat().st_size
    probe=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_streams','-show_format','-of','json',str(f)]));stream=probe['streams'][0];assert stream['codec_name']=='mp3' and stream['channels']==1;duration=float(probe['format']['duration']);assert 25<duration<100,(s['id'],duration);durations.append((s['id'],round(duration,1)))
 assert count>0
 print(f'PASS: {len(paths)} sets, {count} questions, globally unique IDs, valid references')
 if require_audio:print(f'PASS: MP3 mono audio {audio_bytes/1048576:.2f} MiB; durations {durations}')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--without-audio',action='store_true');a=p.parse_args();validate(not a.without_audio)
