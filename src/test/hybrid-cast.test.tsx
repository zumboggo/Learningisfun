import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {createCharacter} from '../../functions/learning-content/src/character-builder.js';
import {validateRig,packageAssetEntries,packageContentBytes,EMOTIONS} from '../../functions/learning-content/src/acting-library.js';
import {packageBytes} from '../../functions/learning-content/src/animated-episodes.js';
import {importStory} from '@/services/animated-stories';
import CartoonActor from '@/components/animated/CartoonActor';
const cast=['lin','hepting','mei','yeyul','jordan'].map(id=>JSON.parse(readFileSync(`public/stories/animated/rigs/${id}-cartoon.json`,'utf8')));
afterEach(cleanup);
it('defaults new characters to polished SVG, retaining chosen colours and legacy flat packs',()=>{
 const c=createCharacter({id:'Guest',name:'Guest',palette:{skin:'#123456',shirt:'#2468ac'}});
 expect(c.rig.finish).toBe('polished');expect(c.rig.head).toBeUndefined();
 const {container,rerender}=render(<CartoonActor character={c} reduced/>);
 expect(container.querySelector('svg')).toHaveAttribute('data-finish','polished');expect(container.querySelectorAll('image')).toHaveLength(0);
 expect(container.querySelector('linearGradient[id$="-shirt"] stop[offset=".7"]')).toHaveAttribute('stop-color','#2468ac');
 expect(container.querySelector('linearGradient[id$="-skin"]')).toHaveAttribute('gradientUnits','userSpaceOnUse');
 delete c.rig.finish;rerender(<CartoonActor character={c} reduced/>);expect(container.querySelector('svg')).toHaveAttribute('data-finish','flat');expect(container.querySelectorAll('defs')).toHaveLength(0);
});
it('each recurring character embeds one valid head and keeps all expressions and teacher details',()=>{
 for(const c of cast){expect(validateRig(c.rig)).toBeNull();expect(c.rig.finish).toBe('hybrid');
  const {container,rerender,unmount}=render(<CartoonActor character={c} reduced/>);
  for(const emotion of EMOTIONS){rerender(<CartoonActor character={c} emotion={emotion} reduced/>);expect(container.querySelectorAll('[data-illustrated-head]')).toHaveLength(1);expect(container.querySelectorAll('[data-arm]')).toHaveLength(2);expect(container.querySelectorAll('[data-mouth]')).toHaveLength(1);}
  if(c.name==='Mr. Hepting'){expect(container.querySelectorAll('[data-glasses]')).toHaveLength(1);expect(container.querySelectorAll('[data-facial-hair]')).toHaveLength(1);}
  fireEvent.error(container.querySelector('image')!);expect(container.querySelectorAll('image')).toHaveLength(0);expect(container.querySelectorAll('[data-mouth]')).toHaveLength(1);unmount();
 }
});
it('hybrid images are budgeted, validated and included in portable episode ZIPs',async()=>{
 const pack=JSON.parse(readFileSync('public/stories/own-english/animated/episode.json','utf8'));
 expect(packageAssetEntries(pack).includes(pack.assets.characters.Lin.rig.head)).toBe(true);
 expect(packageBytes(pack)).toBe(packageContentBytes(pack));expect(packageBytes(pack)).toBeLessThan(5000000);
 const restored=await importStory(readFileSync('public/stories/own-english/animated/the-last-chair.zip') as unknown as File);
 expect(restored.assets.characters.Lin.rig.head.src===pack.assets.characters.Lin.rig.head.src).toBe(true);
 const bad=structuredClone(pack);bad.assets.characters.Lin.rig.head.src='data:image/webp;base64,AAAA';expect(()=>packageBytes(bad)).toThrow('Invalid WebP');
});
it('rejects remote heads, invalid placement and unsupported finishes',()=>{
 const original=cast[0].rig;
 for(const rig of [{...original,finish:'watercolour'},{...original,head:undefined},{...original,head:{...original.head,src:'https://example.com/head.webp'}},{...original,head:{...original.head,frame:[0,0,0,100]}},{...original,head:{...original.head,frame:[0,0,100,Infinity]}},{...original,head:{...original.head,onclick:'alert(1)'}}])expect(validateRig(rig)).not.toBeNull();
});


it('keeps material fills valid on straight and gesturing limbs and isolated between actors',()=>{
 for(const response of [undefined,'wave','recoil','celebrate','explain','reassure']){
  const {container,rerender,unmount}=render(<><CartoonActor character={cast[0]} turn={1} reduced response={response}/><CartoonActor character={cast[1]} turn={-1} reduced response={response}/></>);
  const ids=[...container.querySelectorAll('[id]')].map(n=>n.id);
  expect(new Set(ids).size).toBe(ids.length);
  for(const gradient of container.querySelectorAll('linearGradient[id$="-limb-skin"]')){
   expect(gradient).toHaveAttribute('gradientUnits','userSpaceOnUse');
   expect(Number(gradient.getAttribute('x2'))-Number(gradient.getAttribute('x1'))).toBeGreaterThanOrEqual(20);
  }
  expect(container.querySelectorAll('linearGradient[id$="-limb-skin"]')).toHaveLength(4);
  for(const node of container.querySelectorAll('[fill],[stroke]'))for(const attr of ['fill','stroke']){
   const ref=node.getAttribute(attr)?.match(/^url\(#(.+)\)$/)?.[1];
   if(ref)expect(ids).toContain(ref);
  }
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  if(!response){
   expect([...container.querySelectorAll('.cartoon-actor')].map(n=>n.getAttribute('data-turn'))).toEqual(['1','-1']);
   expect(container.querySelector('[data-fabric-detail]')?.closest('.conversation-torso')).not.toBeNull();
   expect(container.querySelector('[data-mouth]')?.closest('.conversation-head')).not.toBeNull();
  }
  rerender(<CartoonActor character={cast[0]} turn={-1} reduced response={response}/>);
  expect(container.querySelectorAll('[data-arm]')).toHaveLength(2);unmount();
 }
});
