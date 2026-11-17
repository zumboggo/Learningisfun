"""Build portable illustrated readings from editable HTML fragments; stdlib only."""
from pathlib import Path
from html import escape, unescape
from html.parser import HTMLParser
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
SOURCES = json.loads((ROOT / 'sources.json').read_text())
PARTS = [
    {'title': 'What Do We Owe Each Other?', 'subtitle': 'Islam’s beginnings, community, trade, and the obligations of creditors', 'week': 'November 16–20, 2026', 'voice': 'A', 'week_start': '2026-11-16'},
    {'title': 'The Teacher Who Could Not Speak', 'subtitle': 'Al-Ghazali, the purpose of wealth, and ideas that crossed into Europe', 'week': 'November 23–27, 2026 · First reading', 'voice': 'A', 'week_start': '2026-11-23'},
    {'title': 'When a Country Owes Money', 'subtitle': 'Colonialism, reform, modern fundamentalism, and the morality of finance', 'week': 'November 23–27, 2026 · Second reading', 'voice': 'B', 'week_start': '2026-11-23'},
]
IMAGES = {
    '01-caravan': ('Travelers and pack animals approach a mud-brick oasis settlement.', 'Migration required shelter, protection, and new relationships. Imagined early Arabian setting; AI-generated illustration, not a depiction of Muhammad.'),
    '02-market': ('A merchant weighs dates on a balance while a customer watches.', 'Trade makes fair measurement an everyday ethical practice. Imagined scene; AI-generated illustration.'),
    '03-debt': ('A scribe records an agreement while three adults discuss its terms.', 'Recording a debt can protect the parties without settling every moral question. Imagined scene; AI-generated illustration.'),
    '04-ocean': ('A merchant holds a folded letter beside a wooden trading vessel at Aden.', 'A voyage connected investors, sailors, merchants, and distant households. Imagined medieval harbour; AI-generated illustration.'),
    '05-classroom': ('A scholar leaves a quiet teaching room with reading desks and manuscripts.', 'An imagined departure evokes al-Ghazali’s account of leaving Baghdad. AI-generated illustration, not an authentic portrait or reconstruction.'),
    '06-translators': ('Three scholars compare manuscripts in a simple interior workshop.', 'Translation required interpretation, collaboration, and support. Imagined workshop; AI-generated illustration.'),
    '07-cordoba': ('Two scholars discuss manuscript volumes in an Andalusian courtyard.', 'Ibn Rushd argued for philosophical inquiry within Islamic learning. Imagined scene, not an authentic portrait; AI-generated illustration.'),
    '08-fountain': ('Residents collect water from an ornate public fountain on a Cairo street.', 'An endowment could turn a gift into an ongoing public service. Imagined late medieval setting; AI-generated illustration.'),
    '09-canal': ('A steamship passes along the Suez Canal beside workers and a desk with a ledger.', 'Infrastructure, labour, and debt became entangled with imperial power. Imagined nineteenth-century scene; AI-generated illustration.'),
    '10-press': ('Readers and a printer discuss a proof sheet beside a printing press.', 'Education and public debate were central to projects of reform. Imagined Cairo workshop around 1900; AI-generated illustration.'),
    '11-prison': ('A folded manuscript and pencil sit before a closed prison gate.', 'Repression formed part of the setting for Qutb’s later writing. Symbolic imagined scene; AI-generated illustration, not a historical prison record.'),
    '12-finance': ('A woman who runs a sewing workshop discusses a contract with a finance officer.', 'A contract’s effects unfold in the livelihood it helps—or burdens. Imagined contemporary scene; AI-generated illustration.'),
}
CSS = '''
:root{color-scheme:light;--paper:#f7f3ea;--ink:#252f32;--muted:#626b69;--accent:#28625f;--rule:#d8d1c2}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:20px/1.75 Georgia,serif}
main{max-width:850px;margin:auto;padding:42px 28px 72px}header{border-bottom:1px solid var(--rule);padding-bottom:25px;margin-bottom:38px}
h1{font-size:clamp(36px,5.5vw,58px);line-height:1.12;letter-spacing:-.025em;margin:14px 0 20px;font-weight:normal}
h2{font-size:1.35em;line-height:1.3;margin:2.1em 0 .75em}p{margin:0 0 1.15em}a{color:var(--accent);text-underline-offset:3px}
nav,.eyebrow,.meta,figcaption,.sources{font-family:system-ui,sans-serif}nav{font-size:14px;display:flex;gap:20px;flex-wrap:wrap;margin-bottom:28px}
.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700;margin:0}
.subtitle{font-size:22px;line-height:1.45;max-width:650px}.meta{font-size:13px;line-height:1.65;color:var(--muted);margin-bottom:0}
figure{margin:34px 0 42px}img{display:block;width:100%;height:auto;border-radius:5px}figcaption{font-size:13px;line-height:1.55;color:var(--muted);padding-top:10px}
p a[href^="#s"]{font:12px system-ui;white-space:nowrap;text-decoration:none;vertical-align:super;margin-left:3px}
.sources{border-top:1px solid var(--rule);margin-top:48px;padding-top:15px;font-size:14px;line-height:1.65}.sources h2{font-size:20px}.sources li{margin:0 0 9px;padding-left:3px}.sources a{overflow-wrap:anywhere}
.card{border-top:1px solid var(--rule);padding:28px 0 32px;display:grid;grid-template-columns:210px 1fr;gap:25px;align-items:start}.card h2{margin:8px 0 12px;font-size:28px}.card p{font-size:18px;line-height:1.5;margin-bottom:12px}.card .meta{font-size:13px}.card img{aspect-ratio:3/2;object-fit:cover}
footer{border-top:1px solid var(--rule);margin-top:38px;padding-top:24px}footer nav{margin:0}
@media(max-width:600px){body{font-size:18px}main{padding:25px 20px 48px}.subtitle{font-size:20px}.card{grid-template-columns:1fr;gap:14px}.card img{max-height:240px;object-fit:cover}}
@media print{body{background:white;font-size:11pt;line-height:1.5}main{max-width:none;padding:0}nav{display:none}h1{font-size:30pt}h2{break-after:avoid}figure{break-inside:avoid}img{max-height:13cm;object-fit:contain}.sources{font-size:9pt}}
'''

def document(title, body):
    return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + escape(title) + '</title><style>' + CSS + '</style></head><body><main>' + body + '</main></body></html>\n'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

manifest = {'series': 'Ethics in Islam: Debt, Knowledge, and Power', 'unit': 'Ethics from China to Islam', 'timezone': 'Asia/Shanghai', 'delivery': 'Offline illustrated readings; no LMS assignments created', 'parts': []}
for i, part in enumerate(PARTS, 1):
    source = ROOT / f'part-{i}.source.html'
    body = source.read_text()
    prose = ' '.join(re.findall(r'<p>(.*?)</p>', body, re.S))
    prose = re.sub(r'<a .*?</a>', '', prose)
    words = len(unescape(re.sub(r'<[^>]+>', '', prose)).split())
    assert 1500 <= words <= 1800, (i, words)
    ids = re.findall(r'<figure data-image="([^"]+)"></figure>', body)
    assert len(ids) == len(set(ids)) == 4
    for img in ids:
        path = ROOT / 'images' / f'{img}.webp'
        assert path.is_file() and path.stat().st_size > 10000, path
        alt, caption = IMAGES[img]
        figure = f'<figure><img src="images/{img}.webp" width="1536" height="1024" alt="{escape(alt, quote=True)}"><figcaption>{escape(caption)}</figcaption></figure>'
        body = body.replace(f'<figure data-image="{img}"></figure>', figure)
    citations = sorted(set(map(int, re.findall(r'href="#s(\d+)"', body))))
    assert all(1 <= n <= len(SOURCES[f'part{i}']) for n in citations)
    bibliography = '<section class="sources" aria-label="Sources"><h2>Sources</h2><ol>' + ''.join(f'<li id="s{n}" value="{n}"><a href="{escape(SOURCES[f"part{i}"][n-1][1], quote=True)}">{escape(SOURCES[f"part{i}"][n-1][0])}</a></li>' for n in citations) + '</ol></section>'
    header = f'<nav aria-label="Reading navigation"><a href="index.html">All three readings</a></nav><header><p class="eyebrow">Ethics from China to Islam · Reading {i}</p><h1>{escape(part["title"])}</h1><p class="subtitle">{escape(part["subtitle"])}</p><p class="meta">{part["week"]}<br>About 20 minutes · {words:,} words · Four illustrations</p></header>'
    adjacent = [(j, PARTS[j-1]['title']) for j in (i-1,i+1) if 1 <= j <= 3]
    footer = '<footer><nav aria-label="Continue reading">' + ''.join(f'<a href="part-{j}.html">{"Previous" if j < i else "Next"}: {escape(t)}</a>' for j,t in adjacent) + '</nav></footer>'
    (ROOT / f'part-{i}.html').write_text(document(part['title'], header + body + bibliography + footer))
    manifest['parts'].append(dict(part, id=f'islam-ethics-2026-part-{i}', word_count=words, source=source.name, html=f'part-{i}.html', sha256=digest(source), images=[{'file':f'images/{img}.webp','sha256':digest(ROOT/'images'/f'{img}.webp'),'alt':IMAGES[img][0],'caption':IMAGES[img][1]} for img in ids]))

cards = ''.join(f'<article class="card"><a href="{p["html"]}" aria-label="Read {escape(p["title"],quote=True)}"><img src="{p["images"][0]["file"]}" alt="{escape(p["images"][0]["alt"],quote=True)}" width="1536" height="1024"></a><div><p class="eyebrow">Reading {i}</p><h2><a href="{p["html"]}">{escape(p["title"])}</a></h2><p>{escape(p["subtitle"])}</p><p class="meta">{p["week"]}<br>About 20 minutes · {p["word_count"]:,} words</p></div></article>' for i,p in enumerate(manifest['parts'],1))
(ROOT/'index.html').write_text(document(manifest['series'], '<header><p class="eyebrow">Ethics and Leadership · November 16–27, 2026</p><h1>Debt, Knowledge,<br>and Power</h1><p class="subtitle">Three illustrated histories of ethics in Islam—from a community beginning again to a country facing its creditors.</p><p class="meta">Islam’s foundations, major thinkers, influence on Europe, colonialism, and modern reform—with David Graeber’s ideas about debt and morality throughout.</p></header>' + cards))
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

class Check(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]; self.ids=set(); self.images=0
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids
            self.ids.add(attrs['id'])
        if tag=='a': self.refs.append(attrs.get('href',''))
        if tag=='img':
            self.images+=1
            assert attrs.get('alt')
            assert (ROOT/attrs['src']).is_file()
for file in [ROOT/'index.html',*(ROOT/f'part-{i}.html' for i in range(1,4))]:
    check=Check(); check.feed(file.read_text())
    for ref in check.refs:
        if ref.startswith('#'): assert ref[1:] in check.ids, (file,ref)
        elif not ref.startswith('https://'): assert (ROOT/ref).is_file(), (file,ref)
    assert check.images == (3 if file.name=='index.html' else 4)
print(json.dumps([{'title':p['title'],'words':p['word_count'],'images':len(p['images'])} for p in manifest['parts']],indent=2))
