import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import './public-ethics.css';
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
 return <div className="ethics-public">
 <div className="ethics-wrap">
 <nav className="ethics-nav" aria-label="Public adventures"><Link className="ethics-brand" to="/ethics"><span className="ethics-brand-mark" aria-hidden="true">◈</span><span>Ethics <span className="ethics-brand-and">&</span> Leadership</span></Link><span className="ethics-nav-note">Small stories. Lasting questions.</span></nav>
 <main>
 {entry?<><header className="ethics-episode-heading"><Link className="ethics-back" to="/ethics">← All adventures</Link><p className="ethics-eyebrow">An interactive adventure</p><h1>{entry.title}</h1><p>Follow the story. Make your choice. See what changes.</p></header><PublicEpisode key={entry.id} entry={entry}/></>:<>
 <header className="ethics-hero">
 <img className="ethics-hero-art" src={import.meta.env.BASE_URL+'stories/teaching-stone/v1/village.webp'} alt="" fetchPriority="high"/>
 <div className="ethics-hero-copy"><p className="ethics-eyebrow">Interactive adventures in ethics</p><h1>A small stone.<br/>A <em>difficult</em> choice.</h1><p className="ethics-hero-description">A mysterious stone. An unfamiliar world.<br/>People whose futures depend on what you do next.</p><button type="button" className="ethics-button ethics-button-gold" onClick={()=>{document.getElementById('adventures')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}>Find your adventure <span aria-hidden="true">↓</span></button><p className="ethics-hero-footnote">No account. No preparation. Just curiosity.</p></div>
 <div className="ethics-hero-caption" aria-hidden="true"><span>THE TEACHING STONE</span><span>Every choice leaves a trace.</span></div>
 </header>
 <div className="ethics-facts" aria-label="At a glance"><span><b>Free</b> to play</span><span><b>15–20 min</b> per adventure</span><span><b>Ages 14+</b></span><span><b>Your choices.</b> Real questions.</span></div>
 <section className="ethics-adventures" id="adventures" aria-labelledby="adventures-title"><div className="ethics-section-heading"><div><p className="ethics-eyebrow">Choose a story</p><h2 id="adventures-title">Where will the stone take you?</h2></div><p>Two standalone adventures. <br/>There is no perfect way through.</p></div>
 <div className="ethics-cards">{episodes.map((e,i)=><article key={e.id} className="ethics-card"><div className={'ethics-card-art ethics-card-art-'+i}><img src={import.meta.env.BASE_URL+(i===0?'stories/teaching-stone/v1/village.webp':'stories/question-journal/v1/landscape.webp')} alt="" loading="lazy"/><span className="ethics-card-number">0{i+1}</span><span className="ethics-card-location">{i===0?'A village. A shortage. A responsibility.':'A mentor. An exception. An uneasy truth.'}</span></div><div className="ethics-card-copy"><p className="ethics-eyebrow">{i===0?'Leadership · Consequences':'Compassion · Fairness'}</p><h3>{e.title}</h3><p className="ethics-card-summary">{e.summary}</p><Link className="ethics-button ethics-button-dark" to={`/ethics/${e.id}`}>Play adventure <span aria-hidden="true">↗</span></Link><p className="ethics-card-footnote">15–20 minutes · Includes a knowledge check</p></div></article>)}</div></section>
 <section className="ethics-teachers" aria-labelledby="teacher-title"><div className="ethics-teacher-intro"><p className="ethics-eyebrow">Bring the questions into the room</p><h2 id="teacher-title">A story to play.<br/>A conversation to keep.</h2><p>Made for independent exploration, thoughtful pairs, or a whole room of competing opinions. Allow 25–30 minutes with discussion.</p><span className="ethics-teacher-label">For teachers & curious people</span></div><div className="ethics-teacher-steps"><div><span>01</span><section><h3>Choose together</h3><p>Play in pairs or project the story. Ask for reasons before revealing the consequences.</p></section></div><div><span>02</span><section><h3>Take another path</h3><p>Compare two routes. Who benefited? Who paid the cost? What evidence changed your mind?</p></section></div><div><span>03</span><section><h3>Leave with a better question</h3><p>“Whose perspective did we miss, and what would make us reconsider?”</p></section></div></div></section>
 <details className="ethics-details"><summary>Before you begin: content, quizzes & progress</summary><div><p>These fictional historical dilemmas explore hunger, unequal power, and difficult tradeoffs. The protagonist travels through a magical stone and returns safely. The stories are not documentary reconstructions.</p><p>The four-question quiz checks understanding; it does not grade your moral choices. Progress lasts while the page stays open and resets when you leave or reload. Choices and quiz results are not submitted as class grades.</p><p>To share the collection, copy this page’s address. Each adventure also has its own link and a downloadable episode package.</p></div></details>
 </>}
 </main><footer className="ethics-footer"><span>Ethics & Leadership · The Teaching Stone</span><span>Stay curious. Consider the consequences.</span></footer>
 </div></div>;
}

function PublicEpisode({entry}:{entry:typeof episodes[number]}){
 const [pack,setPack]=useState<StoryPackage|null>(null),[error,setError]=useState(''),[run,setRun]=useState(0);
 const base=import.meta.env.BASE_URL+`stories/public-ethics/${entry.id}/`;
 useEffect(()=>{const controller=new AbortController();void fetch(base+'episode.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('The adventure could not be loaded. Please reload to try again.');return r.json();}).then(setPack).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>controller.abort();},[base]);
 return <><p>{entry.summary}</p><p className="text-sm text-slate-600">Progress lasts until you leave or reload this page. No class grades are recorded.</p>{error?<p role="alert">{error}</p>:pack?<><button className="underline" onClick={()=>{if(window.confirm('Restart this adventure? Your current progress will be cleared.'))setRun(r=>r+1);}}>Restart adventure</button><StoryPlayer key={run} pack={pack}/><details className="rounded-xl border p-4"><summary className="cursor-pointer font-bold">Discussion guide and sources</summary><ul className="my-4 list-disc space-y-2 pl-6">{entry.questions.map(q=><li key={q}>{q}</li>)}</ul>{pack.sources?.map(s=><p className="my-3" key={s}>{s}</p>)}<a className="text-blue-700 underline" href={base+'episode.zip'} download>Download episode package for the Story 2 player</a></details></>:<p role="status">Loading adventure…</p>}</>;
}
