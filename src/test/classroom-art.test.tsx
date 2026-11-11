import {afterEach,expect,it} from 'vitest';
import {cleanup,render} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import CartoonActor from '@/components/animated/CartoonActor';
import {classroomIdentity} from '@/components/animated/classroom-art';
import {kevinAngles} from '@/components/animated/kevin-art';
const ids=['Lin','Hepting','Mei','Yeyul','Jordan'];
const cast=Object.fromEntries(ids.map(id=>[id,JSON.parse(readFileSync('public/stories/animated/rigs/'+id.toLowerCase()+'-cartoon.json','utf8'))]));
afterEach(cleanup);
it.each(ids)('%s retains identity, live expression layers and matching artwork in each view',id=>{
 const {container,rerender}=render(<CartoonActor character={cast[id]} reduced/>);
 for(const orientation of ['front','three-quarter','profile'] as const){
  const mouths=[];
  for(const emotion of ['neutral','happy','worried','surprised']){
   rerender(<CartoonActor character={cast[id]} actorId={id} orientation={orientation} emotion={emotion} reduced/>);
   expect(container.querySelector(`[data-vector-design="classroom-${id.toLowerCase()}-${orientation}"]`)).not.toBeNull();
   expect(container.querySelectorAll('image')).toHaveLength(0);
   expect(container.querySelectorAll('[data-vector-nose]')).toHaveLength(1);
   expect(container.querySelectorAll('[data-angle-eye]')).toHaveLength(orientation==='profile'?1:2);
   expect(container.querySelectorAll('[data-arm]')).toHaveLength(2);
   expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
   mouths.push(container.querySelector('[data-mouth]')!.innerHTML);
   if(id==='Hepting'){expect(container.querySelector('[data-angle-glasses]')).not.toBeNull();expect(container.querySelector('[data-angle-beard]')).not.toBeNull();}
  }
  expect(new Set(mouths).size).toBe(4);
 }
 rerender(<CartoonActor character={cast[id]} actorId={id} turn={-1} reduced/>);
 expect(container.querySelector('[data-angle-face]')!.getAttribute('transform')).toBe('translate(240 0) scale(-1 1)');
 rerender(<CartoonActor character={cast[id]} actorId={id} orientation="profile" prop="phone" reduced/>);
 expect(container.querySelector('svg')?.getAttribute('data-angle')).toBe('front');
 expect(container.querySelector('[data-prop="phone"]')).not.toBeNull();
});
it('leaves unrelated custom characters alone even if they share a name',()=>{
 expect(classroomIdentity({...cast.Lin,rig:{...cast.Lin.rig,palette:{...cast.Lin.rig.palette,skin:'#ffffff'}}})).toBeUndefined();
});
it('Kevin has a smooth three-quarter cheek instead of a second nose and an unsqueezed head',()=>{
 expect(kevinAngles['three-quarter'].outline).not.toContain('163 139');
 const character=JSON.parse(readFileSync('public/stories/animated/rigs/kevin-cartoon.json','utf8'));
 const {container}=render(<CartoonActor character={character} orientation="profile" reduced/>);
 const torso=container.querySelector<SVGGElement>('.conversation-torso')!,head=container.querySelector<SVGGElement>('.conversation-head')!;
 const scale=(s:string)=>Number(s.match(/scaleX\(([^)]+)\)/)![1]);
 expect(scale(torso.style.transform)*scale(head.style.transform)).toBeCloseTo(1);
 expect(scale(torso.style.transform)).toBeGreaterThan(.8);
});
