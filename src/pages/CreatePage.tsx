import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {Navigate,useLocation,useNavigate,useParams,useSearchParams} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {executeLearningContent as call} from '@/services/learning-content.service';
import {LessonBuilder} from './LessonBuilder';
import TextStudio from './TextStudio';
import './episode-studio.css';
import './create-studio.css';
const EpisodeStudio=lazy(()=>import('./AnimatedStudioPage'));
const types=['text','episode','lesson'] as const;
type Kind=typeof types[number];
type Draft={id:string;title:string;type:Kind;updatedAt?:string};
export function LegacyEpisodeCreate(){const location=useLocation();return <Navigate replace to={'/create/episode'+location.search}/>}
export default function CreatePage(){const {user}=useAuth();return user?<CreateWorkspace key={user.$id} userId={user.$id}/>:null;}
function CreateWorkspace({userId}:{userId:string}){
 const {type}=useParams(),[query]=useSearchParams(),navigate=useNavigate(),[drawer,setDrawer]=useState(query.has('resume')),[drafts,setDrafts]=useState<Draft[]>([]),[search,setSearch]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const active=useRef<Partial<Record<Kind,string>>>({}),save=useRef<()=>Promise<void>>(async()=>{}),moving=useRef(false);
 const kind=types.includes(type as Kind)?type as Kind:null,id=query.get('draft');
 const [fresh]=useState(()=>crypto.randomUUID());
 const registerSave=(fn:()=>Promise<void>)=>{save.current=fn};
 useEffect(()=>{if(kind){localStorage.setItem('create-kind:'+userId,kind);if(id)active.current[kind]=id;}},[kind,id,userId]);
 async function go(next:Kind,draft?:string){if(moving.current)return;moving.current=true;setError('');try{await save.current();save.current=async()=>{};navigate('/create/'+next+'?draft='+(draft||active.current[next]||crypto.randomUUID()));setDrawer(false)}catch(e){setError((e as Error).message)}finally{moving.current=false}}
 async function openAssigned(){if(moving.current)return;moving.current=true;setError('');try{await save.current();navigate('/lessons')}catch(e){setError((e as Error).message)}finally{moving.current=false}}
 async function loadDrafts(){setDrawer(true);setLoading(true);setError('');const results=await Promise.allSettled([call<any>({action:'textStudioLibrary'}),call<any>({action:'animatedLibrary'}),call<any>({action:'lessonBuilderLibrary'})]);const rows:Draft[]=[];results.forEach((r,i)=>{if(r.status==='fulfilled')rows.push(...r.value.drafts.map((d:any)=>({id:d.id,title:d.title,type:types[i],updatedAt:d.updatedAt})));else setError('Some drafts could not be loaded. Your current work is safe; try opening Resume draft again.');});setDrafts(rows.sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'')));setLoading(false)}
 useEffect(()=>{if(query.has('resume'))void loadDrafts()},[]);
 if(!kind){const stored=localStorage.getItem('create-kind:'+userId);return <Navigate replace to={'/create/'+(types.includes(stored as Kind)?stored:'text')+'?draft='+fresh}/>}
 if(!id){const next=new URLSearchParams(query);next.set('draft',fresh);return <Navigate replace to={'/create/'+kind+'?'+next.toString()}/>;}
 return <main className="episode-studio create-studio"><header className="create-header"><div><p className="studio-eyebrow">TEACHING STUDIO</p><h1>Create</h1></div><div className="studio-actions">{kind==='lesson'&&<button onClick={()=>void openAssigned()}>Edit assigned lesson</button>}<button onClick={()=>void loadDrafts()}>Resume draft</button><button onClick={()=>void go(kind,crypto.randomUUID())}>＋ New {kind}</button></div></header><nav className="create-types" aria-label="Content type">{types.map(t=><button key={t} aria-current={kind===t?'page':undefined} onClick={()=>void go(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</nav>{error&&<p role="alert" className="studio-feedback">{error}</p>}
 {drawer&&<section role="dialog" aria-modal="false" aria-label="Resume a draft" className="create-drawer"><div className="studio-review-heading"><h2>Pick up where you left off</h2><button onClick={()=>setDrawer(false)}>Close</button></div><label>Search drafts<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label>{loading?<p role="status">Loading your drafts…</p>:drafts.filter(d=>d.title.toLowerCase().includes(search.toLowerCase())).map(d=><button className="create-draft-row" key={d.type+d.id} onClick={()=>void go(d.type,d.id)}><span><strong>{d.title}</strong><small>{d.type}{d.updatedAt?' · '+new Date(d.updatedAt).toLocaleDateString():''}</small></span><span>Continue →</span></button>)}{!loading&&!drafts.length&&<p>Your saved drafts will appear here.</p>}</section>}
 <Suspense fallback={<p>Opening studio…</p>}>{kind==='text'?<TextStudio key={id} id={id} registerSave={registerSave}/>:kind==='episode'?<EpisodeStudio key={id} registerSave={registerSave}/>:<LessonBuilder key={id} initialDraftId={id} startNew registerSave={registerSave} onClose={()=>void loadDrafts()}/>}</Suspense>
 </main>;
}
