import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import source from '../../stories/teaching-stone/story.js?raw';
const events:Record<string,()=>void>={};
let setup:Record<string,any>;
beforeEach(()=>{
 vi.useFakeTimers();setup={};
 const dollar=()=>({on:(name:string,fn:()=>void)=>{events[name]=fn;},one:()=>{}});
 vi.stubGlobal('matchMedia',()=>({matches:false}));vi.stubGlobal('scrollTo',vi.fn());
 new Function('Config','setup','Macro','$',source)({history:{},saves:{},ui:{},passages:{},navigation:{}},setup,{add:()=>{}},dollar);
 document.body.innerHTML='<div class="passage"><h1>Seed grain</h1><div class="story-beats"><p>First <strong>duty</strong>.</p><p>Second paragraph.</p></div><div class="after-beats"><button>Decide</button></div></div>';
 events[':passagedisplay']();
});
afterEach(()=>{setup.cancelReveal();vi.useRealTimers();vi.unstubAllGlobals();});
const click=(text:string)=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===text);expect(b).toBeTruthy();b!.click();};
describe('story pacing',()=>{
 it('reveals a paragraph, advances, then exposes choices without losing the transcript',()=>{
  expect((document.querySelector('.after-beats') as HTMLElement).hidden).toBe(true);
  expect(document.querySelector('.sr-only')?.textContent).toBe('First duty.');
  click('Next ▸'); // First click finishes typing.
  expect(document.querySelector('.story-beats strong')?.textContent).toBe('duty');
  click('Next ▸');expect(document.querySelector('.beat-count')?.textContent).toBe('2 / 2');
  vi.runAllTimers();click('Continue ▸');
  expect((document.querySelector('.after-beats') as HTMLElement).hidden).toBe(false);
  expect(document.querySelector('.after-beats details')?.textContent).toContain('First duty.Second paragraph.');
  expect(document.querySelector('.sr-only')).toBeNull();
 });
 it('can show everything immediately and cancels animation when navigating away',()=>{
  click('Show all');expect((document.querySelector('.after-beats') as HTMLElement).hidden).toBe(false);
  expect([...document.querySelectorAll('.story-beats p')].every(p=>!(p as HTMLElement).hidden)).toBe(true);
  events[':passageinit']();expect(document.querySelector('.sr-only')).toBeNull();
 });
});

it('respects reduced motion without a typing interval',()=>{
 setup.cancelReveal();vi.stubGlobal('matchMedia',()=>({matches:true}));
 document.body.innerHTML='<div class="passage"><h1>Quiet</h1><div class="story-beats"><p>Complete text.</p></div><div class="after-beats"><button>Decide</button></div></div>';
 events[':passagedisplay']();expect(document.querySelector('.sr-only')).toBeNull();
 expect(document.querySelector('.story-beats')?.textContent).toBe('Complete text.');click('Continue ▸');
 expect((document.querySelector('.after-beats') as HTMLElement).hidden).toBe(false);
});

it('waits for story startup before restoring an early parent initialization',async()=>{
 const {runInNewContext}=await import('node:vm');
 const handlers:Record<string,Function>={},parent={postMessage:()=>{}},plays:string[]=[];
 const context:any={Config:{history:{},saves:{},ui:{},passages:{},navigation:{}},setup:{rules:{replay:()=>{}}},window:{parent,addEventListener:(name:string,fn:Function)=>handlers[name]=fn},location:{origin:'https://example.org'},Engine:{play:(p:string)=>plays.push(p)},State:{passage:'Start'}};
 runInNewContext(source.slice(0,source.indexOf("Macro.add('stoneChoice'")),context);
 handlers.message({origin:context.location.origin,source:parent,data:{protocol:'teaching-stone-v1',type:'init',channel:'test',choices:Array(10).fill('test')}});
 expect(plays).toEqual([]);context.setup.booted=true;context.setup.refresh();expect(plays).toEqual(['Assessment']);
 handlers.message({origin:'https://other.org',source:parent,data:{protocol:'teaching-stone-v1',type:'init',channel:'bad',choices:[]}});expect(context.setup.choices).toHaveLength(10);
});
