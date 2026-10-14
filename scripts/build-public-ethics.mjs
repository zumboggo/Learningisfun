import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {validatePackage} from '../functions/learning-content/src/story-engine.js';
import {packageBytes} from '../functions/learning-content/src/animated-episodes.js';
const root=new URL('../',import.meta.url);
for(const slug of ['the-grain-we-keep','the-measure-that-changed']){
 const pack=JSON.parse(await readFile(new URL(`public/stories/animated/${slug}/episode.json`,root),'utf8'));
 pack.title=pack.title.replace(' — Animated version','');
 pack.description=slug==='the-grain-we-keep'?'A mysterious stone carries you to a village facing a grain shortage. Balance urgent needs, future harvests and the responsibilities of leadership.':'A mysterious stone carries you to a grain-store courtyard. Your mentor helps a neighbour—but changes the record. Explore compassion, impartiality and accountability.';
 pack.script=await readFile(new URL(`stories/public-ethics/${slug}.story`,root),'utf8');
 delete pack.assets.characters.Hepting;delete pack.assets.characters.Lin;delete pack.assets.backgrounds.classroom;
 pack.assets.backgrounds.path={src:'data:image/webp;base64,'+(await readFile(new URL('public/stories/question-journal/v1/landscape.webp',root))).toString('base64')};
 pack.sources=[
 'Historical setting: a fictional Egyptian village around 1900 BCE. Characters, dialogue, quantities, policies and events are invented for ethical inquiry, not a reconstruction of a documented incident or Egyptian legal procedures. No historical quotations are used.',
 'Ma’at connects truth, justice and right order. The dilemmas invite ethical discussion; they do not claim that ancient Egyptian institutions followed the procedures proposed here.',
 'Background reading: The Metropolitan Museum of Art, Model of a Granary with Scribes (Middle Kingdom). https://www.metmuseum.org/art/collection/search/545281',
 'Background reading: British Museum, Maat. https://www.britishmuseum.org/collection/term/BIOG54349',
 'Illustrations are fictional teaching designs. Historical clothing and settings are approximate. The stone and time travel are fantasy.',
 'Four knowledge questions follow the story; three correct completes the knowledge check, with review and retry. Story decisions receive no moral score. Discuss reasons, evidence, affected people and costs rather than searching for a single approved choice.'
 ];
 const result=validatePackage(pack);if(result.errors.length)throw Error(JSON.stringify(result.errors));
 const text=JSON.stringify(pack,null,2)+'\n';
 if(/hepting|\bdavid\b|\bCDIS\b|lifeplus|instructure|school|classroom|wake up|waking up|reincarnat/i.test(text))throw Error('Private reference or old framing in '+slug);
 if(packageBytes(pack)>5000000)throw Error('Oversize package');
 const dir=new URL(`public/stories/public-ethics/${slug}/`,root);await mkdir(dir,{recursive:true});
 if(process.argv.includes('--check')){if(await readFile(new URL('episode.json',dir),'utf8')!==text)throw Error('Stale public package: '+slug);}else await writeFile(new URL('episode.json',dir),text);
 console.log(slug,packageBytes(pack),'bytes; valid public edition');
}
