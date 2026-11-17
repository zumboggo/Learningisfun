from pathlib import Path
import urllib.request,json
root=Path(__file__).parent
items=[
 {'file':'focus.jpg','url':'https://library.ascd.org/m/7ebef54a1531485f/webimage-bookcover6x9-Focus-3rdEd-Schmoker.jpg?q=90','source':'https://www.ascd.org/books/focus-3rd-edition?variant=126031','alt':'Cover of Focus, third edition, by Mike Schmoker'},
 {'file':'orthodoxy.jpg','url':'https://target.scene7.com/is/image/Target/GUEST_5697d66f-4e7a-439a-9e99-29888af9a474','source':'https://www.target.com/p/-/A-77730286','alt':'Cover of Orthodoxy by G. K. Chesterton, Dover edition'},
 {'file':'make-just-one-change.jpg','url':'https://harvard-edu-press.imgix.net/covers/9781612500997.jpg?w=600','source':'https://hep.gse.harvard.edu/9781612500997/make-just-one-change/','alt':'Cover of Make Just One Change by Dan Rothstein and Luz Santana'},
 {'file':'knowledge-gap.jpg','url':'https://cdn2.penguin.com.au/covers/original/9780735213579.jpg','source':'https://www.penguin.com.au/books/the-knowledge-gap-9780735213579','alt':'Cover of The Knowledge Gap by Natalie Wexler'}]
for v in items:
 dest=root/'images'/v['file']
 if not dest.exists():
  try:
   r=urllib.request.urlopen(urllib.request.Request(v['url'],headers={'User-Agent':'Mozilla/5.0'}),timeout=30)
   b=r.read();assert b[:3]==b'\xff\xd8\xff' or b[:4]==b'\x89PNG';dest.write_bytes(b)
   print(v['file'],len(b),flush=True)
  except Exception as e:print(v['file'],type(e).__name__,str(e)[:100],flush=True)
(root/'image-sources.json').write_text(json.dumps(items,indent=2)+'\n')
