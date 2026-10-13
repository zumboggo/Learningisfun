import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {buildChoice,insertScript,routeToChoice} from '../components/animated/authoring-tools';
import {compileStory,initialStoryState,settleStory,advanceStory} from '../../functions/learning-content/src/story-engine.js';
import {createCharacter} from '../../functions/learning-content/src/character-builder.js';
import SceneBeatLibrary from '../components/animated/SceneBeatLibrary';
import ChoiceWorkshop from '../components/animated/ChoiceWorkshop';
const pack={format:2 as const,title:'Test',description:'',profile:'',script:'story 2\nshow Lin neutral left\nshow Yeyul neutral right\nI: Before.\nend',assets:{backgrounds:{},characters:{Lin:createCharacter({id:'Lin',name:'Lin'}),Yeyul:createCharacter({id:'Yeyul',name:'Yeyul'})}},quiz:Array.from({length:4},()=>({prompt:'Q',options:['a','b','c','d'],answer:0,explanation:'Why'}))};
const options=[{text:'Ask privately',emotion:'relieved',response:'Thank you.',callback:'You were discreet.'},{text:'Ask publicly',emotion:'angry',response:'Everyone heard.',callback:'Tell them the correction.'},{text:'Check first',emotion:'curious',response:'Let us check.',callback:'You checked.'}];
it('generates portable two/three-way choices with correct callbacks and reconnection',()=>{
 for(const count of [2,3]){
 const out=buildChoice(pack,'approach','Lin',options.slice(0,count),true);
 const script=insertScript(insertScript(pack.script,out.choice).replace('story 2\n','story 2\n'+out.declaration),'I: Later.\n'+out.callback);
 const p={...pack,script},compiled=compileStory(script,pack.assets);expect(compiled.errors).toEqual([]);
 const route=routeToChoice(p,'approach');expect(route.decisions).toEqual([]);
 for(let i=0;i<count;i++){let state=advanceStory(route.story,route.state,'option'+i);const text=[];while(!state.ended){text.push(route.story.nodes[state.cursor].text);state=advanceStory(route.story,state,null);}expect(text).toContain(options[i].callback);expect(text.filter(t=>options.some(o=>o.callback===t))).toHaveLength(1);}
 }
});
it('rejects unsafe text, identifier collisions and the fifth variable',()=>{
 expect(()=>buildChoice(pack,'bad id','Lin',options,true)).toThrow();
 expect(()=>buildChoice(pack,'okay','Lin',[{...options[0],text:'bad\ntext'},options[1]],true)).toThrow();
 const four={...pack,script:pack.script.replace('story 2','story 2\n'+['a','b','c','d'].map(n=>`variable ${n} = false hidden`).join('\n'))};
 expect(()=>buildChoice(four,'okay','Lin',options,true)).toThrow(/four variables/);expect(buildChoice(four,'okay','Lin',options,false).callback).toBe('');
 expect(()=>buildChoice({...pack,script:pack.script.replace('end','label approach_test0\nend')},'approach','Lin',options,true)).toThrow(/overlaps/);
});
it('previews an actual path including prior choices and reports unreachable chance paths',()=>{
 const script='story 2\nvariable seen = false hidden\nchoice earlier\noption a "One" -> join ; seen = true\noption b "Two" -> join\nlabel join\nshow Lin happy left\nchoice later\noption a "Stay" -> end\noption b "Go" -> end\nlabel end\nend';
 const route=routeToChoice({...pack,script},'later');expect(route.decisions).toEqual(['One']);expect(route.state.variables.seen).toBe(true);expect(route.state.stage.actors.Lin.expression).toBe('happy');
 expect(()=>routeToChoice(pack,'missing')).toThrow(/No route/);
});
it('camera sequence previews all three shots and inserts standard portable commands',()=>{
 const onChange=vi.fn();const view=render(<SceneBeatLibrary pack={pack} onChange={onChange}/>);
 fireEvent.change(screen.getByLabelText('Beat framing'),{target:{value:'conversation'}});
 expect(view.container.querySelector('[data-shot="wide"]')).toBeTruthy();fireEvent.click(screen.getByText('Next shot'));expect(view.container.querySelector('[data-shot="medium"]')).toBeTruthy();fireEvent.click(screen.getByText('Next shot'));expect(view.container.querySelector('[data-shot="close"]')).toBeTruthy();
 fireEvent.click(screen.getByText('Insert beat after selected script line'));const script=onChange.mock.calls[0][0].script;expect(compileStory(script,pack.assets).errors).toEqual([]);expect(script).toContain('camera close Yeyul');
 const {story}=compileStory(script,pack.assets);let state=settleStory(story,initialStoryState(story));while(!state.ended)state=advanceStory(story,state,null);expect(state.stage.camera?.shot).toBe('wide');
});
it('studio builder exposes insertion and retains callback text for later placement',()=>{
 const onChange=vi.fn();render(<ChoiceWorkshop pack={pack} onChange={onChange}/>);fireEvent.click(screen.getByText('Insert choice'));expect(onChange).toHaveBeenCalledOnce();expect(screen.getByText('Insert callback at later script line')).toBeTruthy();
});
