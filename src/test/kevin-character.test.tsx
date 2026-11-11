import {afterEach,expect,it} from 'vitest';
import {cleanup,render} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import JSZip from 'jszip';
import CartoonActor from '@/components/animated/CartoonActor';
import {validatePackage} from '../../functions/learning-content/src/story-engine.js';
import {validateRig,packageContentBytes} from '../../functions/learning-content/src/acting-library.js';
const pack=JSON.parse(readFileSync('public/stories/animated/kevin-starter.json','utf8'));
const character=pack.assets.characters.Kevin;
afterEach(cleanup);
it('Kevin starter validates and preserves the vector identity in a ZIP snapshot',async()=>{
 expect(validateRig(character.rig)).toBeFalsy();expect(validatePackage(pack).errors).toEqual([]);
 expect(packageContentBytes(pack)).toBeLessThan(5000000);
 const zip=new JSZip();zip.file('episode.json',JSON.stringify(pack));
 const roundtrip=JSON.parse(await (await JSZip.loadAsync(await zip.generateAsync({type:'uint8array'}))).file('episode.json')!.async('string'));
 expect(roundtrip.assets.characters.Kevin).toEqual(character);expect(validatePackage(roundtrip).errors).toEqual([]);
});
it('Kevin expressions and extreme poses keep the approved face and articulated limbs',()=>{
 const {container,rerender}=render(<CartoonActor character={character} emotion="happy" reduced/>);
 const happy=container.querySelector('[data-mouth]')!.innerHTML;
 expect(container.querySelector('[data-kevin-face]')).not.toBeNull();
 expect(container.querySelectorAll('image')).toHaveLength(0);
 for(const emotion of ['neutral','worried','angry','surprised']){
  rerender(<CartoonActor character={character} emotion={emotion} reduced/>);
  expect(container.querySelector('[data-mouth]')!.innerHTML).not.toEqual(happy);
 }
 for(const response of ['wave','recoil','celebrate','cross-arms','point']){
  rerender(<CartoonActor character={character} response={response} reduced turn={1}/>);
  expect(container.querySelectorAll('[data-arm]')).toHaveLength(2);
  expect(container.querySelector('[data-kevin-face]')).not.toBeNull();
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
 }
});

it('uses Kevin-specific vector silhouettes and unique paint IDs for every angle',()=>{
 const {container}=render(<>{(['front','three-quarter','profile'] as const).map(orientation=><CartoonActor key={orientation} character={character} orientation={orientation} reduced/>)}</>);
 expect(container.querySelector('[data-kevin-face="option-a"]')).not.toBeNull();
 expect(container.querySelector('[data-vector-design="kevin-option-a-three-quarter"]')).not.toBeNull();
 expect(container.querySelector('[data-vector-design="kevin-option-a-profile"]')).not.toBeNull();
 const ids=[...container.querySelectorAll('[id]')].map(e=>e.id);expect(new Set(ids).size).toBe(ids.length);
 for(const el of container.querySelectorAll('[fill]')){const m=el.getAttribute('fill')?.match(/^url\(#(.+)\)$/);if(m)expect(ids).toContain(m[1]);}
 expect(container.querySelectorAll('image')).toHaveLength(0);
});
it('keeps distinct worried, happy and surprised mouths at every angle and mirrors automatic turns',()=>{
 const {container,rerender}=render(<CartoonActor character={character} reduced/>);
 for(const orientation of ['front','three-quarter','profile'] as const){
  const mouths=[];for(const emotion of ['happy','worried','surprised']){rerender(<CartoonActor character={character} orientation={orientation} emotion={emotion} reduced/>);mouths.push(container.querySelector('[data-mouth]')!.innerHTML);expect(container.innerHTML).not.toMatch(/NaN|Infinity/);}
  expect(new Set(mouths).size).toBe(3);
 }
 rerender(<CartoonActor character={character} orientation="auto" turn={-1} reduced/>);
 expect(container.querySelector('[data-angle-face]')?.getAttribute('transform')).toBe('translate(240 0) scale(-1 1)');
});
