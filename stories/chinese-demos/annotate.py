"""Build reviewed chunk annotations from the adjacent original story sources."""
import json,re,pathlib
from pypinyin import lazy_pinyin,Style,load_phrases_dict
load_phrases_dict({'一会儿':[['yí'],['huì'],['r']], '还碗':[['huán'],['wǎn']], '还。':[['huán'],['。']], '长，':[['cháng'],['，']], '长的':[['cháng'],['de']], '用不了':[['yòng'],['bù'],['liǎo']]})
# Contextual readings reviewed against every sentence and every individual chunk.
CORRECTIONS={'肚子':['dù','zi'],'教我':['jiāo','wǒ'],'教他们':['jiāo','tā','men'],'说得':['shuō','de'],'笑得':['xiào','de'],'这只':['zhè','zhī'],'那只':['nà','zhī'],'不急着还':['bù','jí','zhe','huán'],'长，':['cháng','，'],'先生':['xiān','sheng'],'消息':['xiāo','xi'],'晚上':['wǎn','shang'],'不好意思':['bù','hǎo','yì','si'],'第一个':['dì','yī','ge'],'爸爸':['bà','ba'],'妈妈':['mā','ma'],'时候':['shí','hou'],'眼睛':['yǎn','jing'],'记得':['jì','de']}
def roman(text):
 tokens=lazy_pinyin(text,style=Style.TONE,errors=lambda chars:list(chars))
 assert len(tokens)==len(text),text
 for phrase,reading in CORRECTIONS.items():
  start=0
  while (index:=text.find(phrase,start))>=0:
   tokens[index:index+len(phrase)]=reading;start=index+len(phrase)
 return ' '.join(tokens)
root=pathlib.Path(__file__).resolve().parent
for source in root.glob('*.source'):
 lines={};script=[]
 for row in source.read_text().splitlines():
  code,sep,meta=row.strip().partition(' || ');script.append(code)
  if not sep:continue
  m=re.match(r'option \w+ "(.*?)"',code)
  text=m[1] if m else code.split(': ',1)[1]
  chunks=[]
  for item in meta.split(' / '):
   zh,gloss=item.split('=',1)
   chunks.append({'chinese':zh,'gloss':gloss.strip(),'pinyin':roman(zh)})
  assert ''.join(c['chinese'] for c in chunks)==text,(source.name,text)
  line={'english':' '.join(c['gloss'] for c in chunks),'pinyin':roman(text),'interlinear':chunks}
  if text in lines:assert lines[text]==line,text
  lines[text]=line
 (root/(source.stem+'.story')).write_text('\n'.join(script)+'\n')
 (root/(source.stem+'.language.json')).write_text(json.dumps(lines,ensure_ascii=False,indent=2)+'\n')
 print(source.stem,len(lines),'annotated entries')
