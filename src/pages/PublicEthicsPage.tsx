import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import StoryPlayer from '../components/animated/StoryPlayer';
import type {StoryPackage} from '../../functions/learning-content/src/story-engine.js';
const episodes=[
 {id:'the-grain-we-keep',title:'The Grain We Keep',summary:'A village has too little grain. Whose needs come first—and who gets to question your decision?',questions:['Who paid the cost of your most generous decision?','What evidence changed your mind?','What could people question after you left?']},
 {id:'the-measure-that-changed',title:'The Measure That Changed',summary:'Your mentor helps someone he knows, then changes the account. Can compassion and fairness pull apart?',questions:['Would you offer the same exception to a stranger?','How did a private or public challenge affect the people involved?','What makes a promise different from accountability?']},
];
export default function PublicEthicsPage(){
 const {slug}=useParams();
 const entry=episodes.find(e=>e.id===slug);
 if(slug&&!entry)return <main className="mx-auto max-w-4xl p-6"><h1>Episode not found</h1><Link to="/ethics">Browse Ethics and Leadership adventures</Link></main>;
 return <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
 <header className="space-y-3"><Link className="text-blue-700 underline" to="/ethics">Ethics and Leadership adventures</Link><h1 className="text-3xl font-bold">{entry?.title||'A small stone. A difficult choice.'}</h1><p>Step into a fictional historical world, make decisions, and discover whose lives they change.</p><p className="text-sm text-slate-600">Free to play · No account required · Ages 14+ · About 15–20 minutes per episode, including the quiz</p></header>
 {entry?<PublicEpisode key={entry.id} entry={entry}/>:<>
 <div className="grid gap-5 sm:grid-cols-2">{episodes.map((e,i)=><article key={e.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Adventure {i+1} · Play independently</p><h2 className="my-3 text-2xl font-bold">{e.title}</h2><p>{e.summary}</p><Link className="mt-5 inline-block rounded-lg bg-blue-700 px-5 py-3 text-white" to={`/ethics/${e.id}`}>Play adventure →</Link></article>)}</div>
 <section className="space-y-3 rounded-2xl bg-slate-100 p-6"><h2 className="text-xl font-bold">For teachers</h2><p>Allow about 25–30 minutes with discussion. Play individually, in pairs, or project a story and vote before each decision. Ask for reasons before revealing the consequences.</p><p>Compare two different routes. Finish by asking: “Whose perspective did we miss, and what would make us reconsider?” The four-question quiz checks understanding; it does not grade students’ moral choices.</p><p>No preparation or class code is needed. These public editions keep progress only while the page stays open; reloading starts again. Choices and quiz results are not submitted as class grades.</p><p>Content note: hunger, unequal power, and difficult tradeoffs. The protagonist travels through a magical stone and returns safely. Historical settings support fictional dilemmas rather than documentary reconstructions.</p><p>To share, copy this page’s address. Each adventure also has its own link.</p></section></>}
 </main>;
}
function PublicEpisode({entry}:{entry:typeof episodes[number]}){
 const [pack,setPack]=useState<StoryPackage|null>(null),[error,setError]=useState(''),[run,setRun]=useState(0);
 const base=import.meta.env.BASE_URL+`stories/public-ethics/${entry.id}/`;
 useEffect(()=>{const controller=new AbortController();void fetch(base+'episode.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('The adventure could not be loaded. Please reload to try again.');return r.json();}).then(setPack).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>controller.abort();},[base]);
 return <><p>{entry.summary}</p><p className="text-sm text-slate-600">Progress lasts until you leave or reload this page. No class grades are recorded.</p>{error?<p role="alert">{error}</p>:pack?<><button className="underline" onClick={()=>{if(window.confirm('Restart this adventure? Your current progress will be cleared.'))setRun(r=>r+1);}}>Restart adventure</button><StoryPlayer key={run} pack={pack}/><details className="rounded-xl border p-4"><summary className="cursor-pointer font-bold">Discussion guide and sources</summary><ul className="my-4 list-disc space-y-2 pl-6">{entry.questions.map(q=><li key={q}>{q}</li>)}</ul>{pack.sources?.map(s=><p className="my-3" key={s}>{s}</p>)}<a className="text-blue-700 underline" href={base+'episode.zip'} download>Download episode package for the Story 2 player</a></details></>:<p role="status">Loading adventure…</p>}</>;
}
