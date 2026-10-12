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
