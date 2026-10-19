from PIL import Image, ImageDraw
from pathlib import Path
out=Path('stories/animated/the-second-ship')
for name in ['assembly','harbour']:
 im=Image.new('RGB',(1280,720),'#c7d8d8'); d=ImageDraw.Draw(im)
 d.ellipse((970,65,1060,155),fill='#eee3b4')
 d.polygon([(0,300),(150,210),(340,300),(560,200),(840,310),(1100,240),(1280,310),(1280,520),(0,520)],fill='#9daea2')
 if name=='assembly':
  d.polygon([(0,390),(400,300),(760,330),(1280,390),(1280,720),(0,720)],fill='#c3b69c')
  for y in [380,410,445]: d.line([(0,y),(280,y-30),(510,y-20)],fill='#8e8b7f',width=4)
  d.polygon([(940,285),(1090,285),(1105,345),(925,345)],fill='#e0d2b6',outline='#65716e',width=3)
  for x in [950,990,1030,1070]:d.rectangle((x,225,x+12,285),fill='#e9dfca',outline='#65716e',width=2)
  d.polygon([(935,225),(1020,195),(1100,225)],fill='#e9dfca',outline='#65716e',width=3)
  d.polygon([(45,420),(195,420),(215,468),(25,468)],fill='#ddd0b7',outline='#65716e',width=3)
 else:
  d.rectangle((0,320,1280,560),fill='#769b9c')
  for y in [350,395,450,510]:d.line([(0,y),(1280,y)],fill='#b1cbca',width=2)
  d.polygon([(800,400),(1200,400),(1140,455),(850,455)],fill='#725e50',outline='#404c50',width=4)
  d.line((1010,220,1010,400),fill='#555851',width=7)
  d.polygon([(1025,235),(1160,360),(1025,360)],fill='#e8debf',outline='#6b746f',width=3)
  for x in range(850,1150,25):d.line((x,427,x-60,482),fill='#585d54',width=3)
  d.polygon([(0,460),(570,460),(1280,620),(1280,720),(0,720)],fill='#c9bda4')
  d.line((0,460,570,460,1280,620),fill='#66736e',width=5)
 d.polygon([(0,600),(450,560),(900,590),(1280,640),(1280,720),(0,720)],fill='#d8cbb1')
 im.save(out/(name+'.webp'),quality=88)
