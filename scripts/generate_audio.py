"""Generate MP3s before deployment. No speech service is used by the app.
Install: python -m pip install edge-tts==7.2.8
Requires ffmpeg. Use --force to replace existing MP3s intentionally.
"""
import argparse,asyncio,json,os,ssl,subprocess,tempfile
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
# Honor the environment's trusted CA bundle, keeping certificate verification on.
ca=ssl.get_default_verify_paths().cafile
if ca and Path(ca).is_file():edge_tts.communicate._SSL_CTX.load_verify_locations(cafile=ca)
async def generate(s,force,semaphore):
 async with semaphore:
  target=ROOT/s['audio']
  if target.exists() and target.stat().st_size>1000 and not force:return
  voices={v['id']:v['voice'] for v in s['speakers']}
  with tempfile.TemporaryDirectory() as d:
   d=Path(d);chunks=[]
   for i,t in enumerate(s['transcript']):
    mp3=d/f'{i}.mp3';wav=d/f'{i}.wav'
    for attempt in range(3):
     try:
      await asyncio.wait_for(edge_tts.Communicate(t['text'],voices[t['speaker']],rate='+0%').save(str(mp3)),90)
      break
     except Exception:
      if attempt==2:raise
      await asyncio.sleep(2*(attempt+1))
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(mp3),'-ar','24000','-ac','1','-af','silenceremove=start_periods=1:start_duration=0.015:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_duration=0.03:start_threshold=-45dB,areverse,apad=pad_dur=0.22',str(wav)],check=True)
    chunks.append(wav)
   import wave
   merged=d/'merged.wav'
   with wave.open(str(merged),'wb') as out:
    out.setnchannels(1);out.setsampwidth(2);out.setframerate(24000)
    for p in chunks:
     with wave.open(str(p),'rb') as inp:out.writeframes(inp.readframes(inp.getnframes()))
   target.parent.mkdir(parents=True,exist_ok=True)
   encoded=d/'final.mp3'
   subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(merged),'-codec:a','libmp3lame','-b:a','64k','-ac','1',str(encoded)],check=True)
   assert encoded.stat().st_size>1000
   target.write_bytes(encoded.read_bytes())
  print(f"Generated {s['id']}: {target.stat().st_size/1024:.0f} KB",flush=True)
async def main():
 parser=argparse.ArgumentParser();parser.add_argument('--force',action='store_true');args=parser.parse_args();sets=[]
 for meta in json.loads((ROOT/'data/catalog.json').read_text())['packs']:sets+=json.loads((ROOT/meta['path']).read_text())['sets']
 semaphore=asyncio.Semaphore(3)
 await asyncio.gather(*(generate(s,args.force,semaphore) for s in sets))
if __name__=='__main__':asyncio.run(main())
