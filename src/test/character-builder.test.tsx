import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {createCharacter} from '../../functions/learning-content/src/character-builder.js';
import {validatePackage} from '../../functions/learning-content/src/story-engine.js';
import CharacterBuilder from '@/components/animated/CharacterBuilder';
import PuppetActor from '@/components/animated/PuppetActor';
const pack=JSON.parse(readFileSync('public/stories/own-english/animated/episode.json','utf8'));
afterEach(cleanup);
it('one recipe round-trips into legal packages for every class without image parts',()=>{
 const recipe={id:'Jordan',name:'Jordan',palette:{skin:'#c88e68'},appearance:{hair:'side-part',age:'teen',outfit:'uniform'}};
 const character=createCharacter(JSON.parse(JSON.stringify(recipe)));
 expect(character.expressions).toEqual({});
 for(const profile of ['ap-language','world-literature','ethics'])expect(validatePackage({...pack,profile,script:'story 2\nshow Jordan happy center\nJordan [happy, reassure]: We can try.\nend',assets:{...pack.assets,characters:{Jordan:character}}}).errors).toEqual([]);
 for(const bad of [{...recipe,id:'I'},{...recipe,name:''},{...recipe,appearance:{hair:'unsupported'}},{...recipe,palette:{hair:'url(x)'}},{...recipe,version:0}])expect(()=>createCharacter(bad)).toThrow();
});
it('studio creates a distinct character and prevents accidental replacement',()=>{
 const add=vi.fn();render(<CharacterBuilder pack={pack} onAdd={add}/>);
 fireEvent.click(screen.getByText('Create a character · shared across all classes'));
 fireEvent.change(screen.getByLabelText('Script ID'),{target:{value:'Lin'}});fireEvent.click(screen.getByText('Add new character to draft'));expect(add).not.toHaveBeenCalled();expect(screen.getByRole('alert')).toHaveTextContent('already exists');
 fireEvent.change(screen.getByLabelText('Script ID'),{target:{value:'Jordan'}});fireEvent.change(screen.getByLabelText('Character name'),{target:{value:'Jordan'}});fireEvent.change(screen.getByLabelText('Hairstyle'),{target:{value:'side-part'}});fireEvent.click(screen.getByText('Add new character to draft'));expect(add).toHaveBeenCalledWith('Jordan',expect.objectContaining({name:'Jordan',rig:expect.objectContaining({appearance:expect.objectContaining({hair:'side-part'})})}));
});
it('Jordan has a working neutral pose and surprised expression with no bitmap fallback',()=>{
 const character=JSON.parse(readFileSync('public/stories/animated/rigs/jordan-cartoon.json','utf8'));const {container,rerender}=render(<PuppetActor character={character} reduced/>);expect(container.querySelectorAll('[data-arm]')).toHaveLength(2);const neutral=container.querySelector('[data-mouth]')!.innerHTML;rerender(<PuppetActor character={character} emotion="surprised" reduced/>);expect(container.querySelector('[data-mouth]')!.innerHTML).not.toEqual(neutral);
});

import {armGeometry,FACE_PATHS} from '@/components/animated/character-geometry';
import {POSES} from '../../functions/learning-content/src/acting-library.js';
it('historical costumes and face modules share legal anatomy and expression positions',()=>{
 for(const face of Object.keys(FACE_PATHS))for(const outfit of ['tunic','robe']){
  const c=createCharacter({id:'Guide',name:'Guide',appearance:{age:'adult',face,outfit},palette:{shirt:'#ded0ab',trim:'#907745'}});
  expect(validatePackage({...pack,assets:{...pack.assets,characters:{...pack.assets.characters,Guide:c}}}).errors).toEqual([]);
  const {container,unmount}=render(<PuppetActor character={c} reduced/>);expect(container.querySelector('[data-costume]')).toHaveAttribute('data-costume',outfit);expect(container.querySelector('[data-face]')).toHaveAttribute('data-face',face);expect(container.querySelectorAll('[data-arm]')).toHaveLength(2);expect(container.querySelector('[data-mouth]')).not.toBeNull();unmount();
 }
});
it('rounded elbows keep fixed bone lengths and continuous finite paths across all poses',()=>{
 for(const pose of Object.values(POSES))for(const side of ['left','right'] as const){
  const g=armGeometry(side,pose[side+'UpperArm']||0,pose[side+'Forearm']||0);
  expect(Math.hypot(g.ex-g.x,g.ey-g.y)).toBeCloseTo(58);expect(Math.hypot(g.wx-g.ex,g.wy-g.ey)).toBeCloseTo(57);
  expect(g.path).not.toMatch(/NaN|Infinity| T /);expect(g.path.endsWith(`L ${g.wx} ${g.wy}`)).toBe(true);
 }
});
it('distinct recurring cast features preserve expressions and articulated props',()=>{
 for(const appearance of [{age:'adult',hair:'tousled',face:'lean',eyes:'keen',outfit:'workshirt'},{age:'elder',hair:'bun',face:'oval',eyes:'gentle',outfit:'cardigan'},{age:'adult',hair:'swept',face:'broad',eyes:'narrow',outfit:'suit'}]){
  const c=createCharacter({id:'Actor',name:'Actor',appearance});expect(validatePackage({...pack,assets:{...pack.assets,characters:{...pack.assets.characters,Actor:c}}}).errors).toEqual([])
  const {container,rerender,unmount}=render(<PuppetActor character={c} reduced prop="phone"/>);const neutral=container.querySelector('[data-mouth]')!.innerHTML
  expect(container.querySelectorAll('[data-arm]')).toHaveLength(2);expect(container.querySelector('[data-prop="phone"]')).not.toBeNull()
  if(appearance.age==='elder')expect(container.querySelector('[data-age-lines]')).not.toBeNull()
  for(const emotion of ['worried','shocked','laughing','angry']){rerender(<PuppetActor character={c} emotion={emotion} reduced prop="phone"/>);expect(container.querySelector('[data-mouth]')!.innerHTML).not.toEqual(neutral);expect(container.innerHTML).not.toMatch(/NaN|Infinity/)}unmount()
 }
 expect(()=>createCharacter({id:'Bad',name:'Bad',appearance:{eyes:'script'}})).toThrow()
})
