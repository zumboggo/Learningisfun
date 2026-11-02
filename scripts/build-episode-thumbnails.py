"""Extract small previews from bundled episode artwork; no player packages are loaded by the class page."""
import base64
import io
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
output = root / 'public/stories/thumbnails'
output.mkdir(parents=True, exist_ok=True)
manifest = {}
preferred = {'dinner-with-the-tyrant': 'palace', 'the-sheep-behind-our-house': 'yard', 'the-welcome-nobody-wanted': 'square'}
for source in sorted((root / 'public/stories/animated').glob('*/episode.json')):
    pack = json.loads(source.read_text())
    backgrounds = pack.get('assets', {}).get('backgrounds', {})
    keys = list(backgrounds)
    key = preferred.get(source.parent.name) or next((k for k in keys if k not in ('classroom', 'journal', 'passage')), next(iter(keys), None))
    if not key:
        continue
    asset = backgrounds[key]
    src = asset.get('src', '') if isinstance(asset, dict) else asset
    if not src.startswith('data:image/'):
        continue
    image = Image.open(io.BytesIO(base64.b64decode(src.split(',', 1)[1]))).convert('RGB')
    ImageOps.fit(image, (160, 160)).save(output / f'{source.parent.name}.webp', quality=78)
    manifest[source.parent.name] = f'stories/thumbnails/{source.parent.name}.webp'
(root / 'src/components/classes/episode-thumbnails.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Built {len(manifest)} lightweight episode thumbnails')
