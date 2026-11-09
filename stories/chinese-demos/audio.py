"""Cached Mandarin-only Edge TTS. No paid generation or English speech."""
import asyncio,hashlib,json,pathlib,re,sys
import edge_tts
root=pathlib.Path(__file__).resolve().parents[2];out=root/'public/stories/shared/chinese-demos/audio';out.mkdir(exist_ok=True)
async def main():
 sem=asyncio.Semaphore(2);jobs={};manifests={}
 for source in (root/'stories/chinese-demos').glob('*.story'):
  manifest={}
  for row in source.read_text().splitlines():
   m=re.match(r'(\w+): (.*)',row);opt=re.match(r'option \w+ "(.*?)"',row)
   if not m and not opt:continue
   actor,text=(m[1],m[2]) if m else ('I',opt[1]);female=actor=='Ning' or actor=='I' and source.stem=='a-message-from-tomorrow'
   voice='zh-CN-XiaoxiaoNeural' if female else 'zh-CN-YunxiNeural'
   settings={'provider':'edge-tts','voice':voice,'text':text,'rate':'-10%','pitch':'+0Hz','volume':'+0%','format':'audio-24khz-48kbitrate-mono-mp3'}
   key=hashlib.sha256(json.dumps(settings,sort_keys=True,ensure_ascii=False).encode()).hexdigest()[:24]
   jobs[key]=settings;manifest[actor+'|'+text]='stories/shared/chinese-demos/audio/'+key+'.mp3'
  manifests[source.stem]=manifest
 async def generate(key,s):
  path=out/(key+'.mp3')
  if path.exists() and path.stat().st_size>500:return
  async with sem:
   temp=path.with_suffix('.part')
   for attempt in range(3):
    try:
     await edge_tts.Communicate(s['text'],s['voice'],rate=s['rate'],pitch=s['pitch'],volume=s['volume']).save(str(temp));temp.replace(path);break
    except Exception:
     if attempt==2:raise
     await asyncio.sleep(2*(attempt+1))
   print('cached',key,flush=True)
 await asyncio.gather(*(generate(k,s) for k,s in jobs.items()))
 for slug,manifest in manifests.items():(root/f'stories/chinese-demos/{slug}.audio.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print('Complete:',len(jobs),'cached Mandarin recordings')
asyncio.run(main())
