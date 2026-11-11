import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import StoryPlayer from '@/components/animated/StoryPlayer';
import {encounterDefaults,readEncounters} from '@/components/animated/encounters';
import {validatePackage} from '../../functions/learning-content/src/story-engine.js';
const line=(text:string)=>({pinyin:'nǐ hǎo',english:'Hello',interlinear:[{chinese:text,pinyin:'nǐ hǎo',gloss:'Hello'}]});
const pack={format:2 as const,title:'Encounters',description:'',profile:'chinese',template:'neutral',assessmentMode:'none' as const,script:'story 2\nlabel opening\nI: 你好。\nI: 再见。\nend',assets:{characters:{},backgrounds:{}},quiz:[],chinese:{lines:{'你好。':line('你好。'),'再见。':line('再见。')},audio:{}}};
afterEach(()=>{cleanup();localStorage.clear()});
it('uses three independent encounters before advancing or saving the story',async()=>{
 const save=vi.fn();render(<StoryPlayer pack={pack} onProgress={save}/>);fireEvent.click(screen.getByText('Accept'));
 expect(screen.getByText('Encounter 1 of 3')).toBeVisible();expect(screen.getByText('nǐ hǎo')).toBeVisible();
 fireEvent.click(screen.getByText('Next →'));expect(screen.getByText('Encounter 2 of 3')).toBeVisible();expect(screen.queryByText('nǐ hǎo')).toBeNull();expect(save).not.toHaveBeenCalled();
 fireEvent.click(screen.getByText('Next →'));expect(screen.getByText('Encounter 3 of 3')).toBeVisible();expect(screen.queryByText('你好。')).toBeNull();
 fireEvent.click(screen.getByText('Next →'));await waitFor(()=>expect(save).toHaveBeenCalledOnce());expect(screen.getByText('Encounter 1 of 3')).toBeVisible();expect(screen.getByText('再见。')).toBeVisible();
});
it('backs up within encounters without changing story progress',()=>{
 render(<StoryPlayer pack={pack}/>);fireEvent.click(screen.getByText('Accept'));fireEvent.click(screen.getByText('Next →'));fireEvent.keyDown(document,{key:'ArrowLeft'});expect(screen.getByText('Encounter 1 of 3')).toBeVisible();
});
it('rejects damaged preferences and incomplete Chinese annotations',()=>{
 localStorage.setItem('lif-chinese-encounters-v1','{"count":3}');expect(readEncounters()).toEqual(encounterDefaults());expect(validatePackage(pack).errors).toEqual([]);expect(validatePackage({...pack,chinese:{lines:{},audio:{}}}).errors).toHaveLength(2);
});
