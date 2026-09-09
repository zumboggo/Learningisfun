import { useEffect,useMemo,useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { WeeklyPlannerEditor } from '@/components/planner/WeeklyPlannerEditor';
import { PlannerWeekNavigation } from '@/components/planner/PlannerWeekNavigation';
import { nearestPlannerWeek, plannerMonday, recallPlannerChoice, rememberPlannerChoice } from '@/services/planner-navigation';
import { normalizePlan } from '@/services/planner-layout';
import { readUnits, unpackUnit, populateSlots, type UnitPlan } from '@/services/unit-planning';
import { parsePlannerSource,plannerDiff,type ParsedPlannerSource } from '@/services/planner-parser';
import { createWeeklyPlan,importPlannerSource,readPlanner,type PlannerSourceRecord,type WeeklyPlanData,type WeeklyPlanRecord } from '@/services/planner.service';

const className=(value:{name:string;courseName:string})=>value.name===value.courseName?value.name:`${value.courseName} · ${value.name}`;

export function PlannerPage(){
 const [units,setUnits]=useState<UnitPlan[]>([]);

 const {user}=useAuth(),classes=useLiveQuery(()=>user?db.classes.where('teacherId').equals(user.$id).and(row=>row.status==='active').toArray():[],[user?.$id]);
 const [sources,setSources]=useState<PlannerSourceRecord[]>([]),[plans,setPlans]=useState<WeeklyPlanRecord[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [pending,setPending]=useState<{name:string;text:string;parsed:ParsedPlannerSource}|null>(null),[mapping,setMapping]=useState<Record<string,string>>({}),[selectedWeek,setSelectedWeek]=useState(''),[data,setData]=useState<WeeklyPlanData|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const active=sources.find(source=>source.active)||sources[0],parsed=useMemo(()=>active?JSON.parse(active.parsedJson) as ParsedPlannerSource:null,[active]);
 const existing=plans.find(plan=>plan.weekKey===selectedWeek);
 const refresh=async()=>{setLoading(true);try{const [result,unitResult]=await Promise.all([readPlanner(),readUnits()]);setUnits(unitResult.units.map(unpackUnit));setSources(result.sources);setPlans(result.plans);}catch(cause){setError(cause instanceof Error?cause.message:'Could not load Planner.');}finally{setLoading(false);}};
 useEffect(()=>{void refresh()},[]);
 useEffect(()=>{if(!parsed||selectedWeek)return;const fallback=nearestPlannerWeek(parsed.weeks,plannerMonday(new Date(),1))?.key||'';setSelectedWeek(recallPlannerChoice('planner-week:'+user?.$id+':'+active?.$id,parsed.weeks.map(week=>week.key),fallback));},[parsed,selectedWeek,user?.$id,active?.$id]);
 const selectWeek=(key:string)=>{rememberPlannerChoice('planner-week:'+user?.$id+':'+active?.$id,key);setSelectedWeek(key);};
 useEffect(()=>{if(!parsed||!selectedWeek)return;const week=parsed.weeks.find(row=>row.key===selectedWeek);if(!week)return;if(existing)setData(populateSlots(normalizePlan(JSON.parse(existing.planJson)),units));else {const prior=[...plans].filter(plan=>plan.weekStart<week.startDate).sort((a,b)=>b.weekStart.localeCompare(a.weekStart))[0];setData(populateSlots(normalizePlan(createWeeklyPlan(week,JSON.parse(active?.mappingJson||'{}'),prior?JSON.parse(prior.planJson):undefined)),units));}},[parsed,selectedWeek,existing?.$id,active?.$id]);
 const pickFile=async(file?:File)=>{if(!file)return;const text=await file.text(),next=parsePlannerSource(text);if(!next.weeks.length){setError(next.warnings[0]||'No weeks found.');return;}const old=parsed,changed=old?plannerDiff(old,next):[];setPending({name:file.name,text,parsed:next});setMapping(active?JSON.parse(active.mappingJson||'{}'):{});setMessage(old?`${changed.length} weeks differ: ${changed.slice(0,8).join(', ')}${changed.length>8?'…':''}. Existing saved weeks will be preserved.`:`Found ${next.weeks.length} weeks and ${[...new Set(next.weeks.flatMap(w=>w.blocks.map(b=>b.code)))].length} class blocks.`)};
 const doImport=async()=>{if(!pending)return;setBusy(true);try{await importPlannerSource(pending.name,pending.text,pending.parsed,mapping);setPending(null);setSelectedWeek('');await refresh();setMessage('Annual plan imported privately.');}catch(cause){setError(cause instanceof Error?cause.message:'Import failed.');}finally{setBusy(false)}};
 if(loading)return <div className="p-6 text-gray-500">Loading Planner…</div>;
 return <div className="mx-auto max-w-[1600px] space-y-3 p-3 sm:p-4">
  <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Teacher only</p><h1 className="text-2xl font-bold text-gray-950">Weekly Planning</h1><p className="mt-1 text-sm text-gray-500">Build your week from a shared resource bank.</p></div>{active&&<label className="cursor-pointer rounded-lg border bg-white px-4 py-2 text-sm font-semibold">Re-import annual plan<input className="hidden" type="file" accept=".txt,text/plain" onChange={event=>void pickFile(event.target.files?.[0])}/></label>}</header>
  {(error||message)&&<p className={`rounded-xl p-3 text-sm ${error?'bg-red-50 text-red-700':'bg-blue-50 text-blue-800'}`}>{error||message}</p>}
  {!active&&!pending&&<Card><div className="py-8 text-center"><h2 className="text-xl font-semibold">Import your annual planning source</h2><p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">The file stays private in Appwrite and is not added to GitHub.</p><label className="mt-5 inline-block cursor-pointer rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white">Choose PLANNER_SOURCE text file<input className="hidden" type="file" accept=".txt,text/plain" onChange={event=>void pickFile(event.target.files?.[0])}/></label></div></Card>}
  {pending&&<Card><h2 className="text-lg font-semibold">Map source blocks to classes</h2><p className="mt-1 text-sm text-gray-500">{message}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{[...new Set(pending.parsed.weeks.flatMap(week=>week.blocks.map(block=>block.code)))].filter(code=>['WL-B','WL-R','AP','ETH'].includes(code)).map(code=><label key={code} className="text-sm font-semibold">{code}<select className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" value={mapping[code]||''} onChange={event=>setMapping(old=>({...old,[code]:event.target.value}))}><option value="">Not mapped</option>{classes?.map(cls=><option key={cls.$id} value={cls.$id}>{className(cls)}</option>)}</select></label>)}</div><div className="mt-5 flex gap-2"><Button loading={busy} disabled={!Object.values(mapping).some(Boolean)} onClick={()=>void doImport()}>Import privately</Button><Button variant="ghost" onClick={()=>setPending(null)}>Cancel</Button></div></Card>}
  {parsed&&data&&<>
   <Card><PlannerWeekNavigation weeks={parsed.weeks} selected={selectedWeek} onChange={selectWeek}/>{data.week.calendar&&<p className="mt-2 text-xs text-slate-500">Calendar: {data.week.calendar}</p>}</Card>
   {active&&user&&data.week.key===selectedWeek&&<WeeklyPlannerEditor key={active.$id+selectedWeek} initial={data} record={existing} sourceId={active.$id} userId={user.$id} units={units} onUnitsChange={setUnits} onSaved={record=>setPlans(old=>[record,...old.filter(item=>item.$id!==record.$id&&item.weekKey!==record.weekKey)])}/>}

  </>}
 </div>;
}
