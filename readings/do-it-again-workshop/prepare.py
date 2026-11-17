from pathlib import Path
import json,hashlib,re
root=Path(__file__).parent
source=Path('/Users/david.hepting/Downloads/Do-It-Again-Workshop-Handout-Revised.md').read_text()
images=json.loads((root/'image-sources.json').read_text())
anchors=['Mike Schmoker’s *Focus* helped','In G. K. Chesterton’s','Dan Rothstein and Luz Santana’s QFT offers','Natalie Wexler’s *The Knowledge Gap* helped']
labels=['*Focus*, third edition — Mike Schmoker. Cover: ASCD.','*Orthodoxy* — G. K. Chesterton. Dover edition cover.','*Make Just One Change* — Dan Rothstein and Luz Santana. Cover: Harvard Education Press.','*The Knowledge Gap* — Natalie Wexler. Cover: Penguin/Avery.']
parts=re.split(r'\n\s*\n',source.strip());out=[]
for part in parts:
 out.append(part)
 for anchor,v,label in zip(anchors,images,labels):
  if part.startswith(anchor):
   out.append(f"![{v['alt']}](images/{v['file']})")
   out.append(f"*[{label}]({v['source']})*")
md='\n\n'.join(out)+'\n'
assert md.count('](images/')==4
(root/'reading.md').write_text(md)
(root/'manifest.json').write_text(json.dumps({'id':'ws26-do-it-again','title':'Do It Again','classId':'5a726282-4771-4774-8213-d9329c124bbc','week':'2026-11-16','dueDate':'2026-11-19','assignedAt':'2026-11-16T08:00:00+08:00','sourceFile': 'Do-It-Again-Workshop-Handout-Revised.md','sourceSha256':hashlib.sha256(source.encode()).hexdigest(),'readingSha256':hashlib.sha256(md.encode()).hexdigest(),'images':images},indent=2)+'\n')
print('Prepared complete edited handout with four book covers')
