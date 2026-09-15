import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { executeLearningContent } from '@/services/learning-content.service';
import { useAuth } from '@/contexts/AuthContext';
import { Markdown } from '@/components/common/Markdown';
import { db } from '@/db/schema';
import type { TextAnnotation } from '@/types';

interface LegacyRecord { id:string;kind:string;content?:string;choice?:string;label?:string;type?:string;date?:string;annotationId?:string;selections?:string[];discussed?:boolean }
export function TextLegacyArchivePage() {
  const {textId}=useParams(),[search]=useSearchParams(),classId=search.get('classId');
  const {isParent,user}=useAuth();
  const [unsent,setUnsent]=useState<TextAnnotation[]>([]);
  const [annotations,setAnnotations]=useState<TextAnnotation[]>([]),[records,setRecords]=useState<LegacyRecord[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{
    let active=true;
    const read=async()=>{
      if(!textId||!classId)throw new Error('Choose a class from the text discussion first.');
      // Authorize current assignment/release before consulting the legacy APIs.
      await executeLearningContent({action:'readReadingDiscussion',textId,classId});
      const pending=await db.sync_queue.where('entityType').equals('text_annotation').filter(r=>r.syncStatus!=='synced').toArray();
      const local=await db.text_annotations.where('[textId+classId]').equals([textId,classId]).toArray();
      if(active)setUnsent(local.filter(a=>a.authorId===user?.$id&&pending.some(p=>p.entityId===a.$id)));
      const legacy=await executeLearningContent<{annotations:TextAnnotation[]}>({action:'readTexts',textId,classIds:[classId],includeContent:true});
      if(active)setAnnotations(legacy.annotations);
      if(!isParent){const tqe=await executeLearningContent<{records:LegacyRecord[]}>({action:'readTqe',textId,classId});if(active)setRecords(tqe.records);}
    };
    void read().catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[textId,classId,isParent,user?.$id]);
  return <div className="mx-auto max-w-3xl space-y-4 p-5"><Link className="text-blue-700" to={`/texts/${textId}?classId=${classId}`}>← Read text</Link><h1 className="text-2xl font-semibold">Legacy annotations & TQE archive</h1><p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Read-only records from the earlier annotation system. Original visibility rules still apply, including private notes and posting thresholds. Nothing here is copied into the new discussions.</p>{error&&<p role="alert" className="text-red-700">{error}</p>}{loading&&<p>Loading archive…</p>}
    {unsent.length>0&&<section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><h2 className="font-semibold">Your unsent legacy work on this device</h2><p className="text-sm">These drafts have not been deleted or shared. You can select and copy their text into a new discussion if you choose.</p>{unsent.map(a=><article key={a.$id}><blockquote>{a.selectedText}</blockquote><p className="whitespace-pre-wrap">{a.content}</p></article>)}</section>}
    <h2 className="text-lg font-semibold">Annotations</h2>{annotations.map(a=><article className="space-y-2 rounded-xl border p-4" key={a.$id}><div className="text-sm text-slate-500">{a.anonymousLabel} · {a.tqeType||a.kind||a.type} · {new Date(a.createdAt).toLocaleDateString()}{a.visibility==='private'&&<strong className="ml-2">Only me</strong>}{a.moderationStatus==='hidden'&&' · Hidden'}</div>{a.selectedText&&<blockquote className="border-l-2 pl-3 font-serif text-slate-600">{a.selectedText}</blockquote>}<Markdown content={a.content}/></article>)}
    <h2 className="text-lg font-semibold">Advanced TQE records</h2>{records.map(r=><article key={r.id} className="space-y-2 rounded-xl border p-4"><h3 className="text-sm font-semibold capitalize">{r.kind}{r.label?` · ${r.label}`:''}</h3>{r.content&&<Markdown content={r.content}/>}<p className="text-sm">{r.choice||r.type||''}{r.date?` · ${r.date}`:''}{r.discussed?' · Discussed':''}</p>{r.annotationId&&<Markdown content={annotations.find(a=>a.$id===r.annotationId)?.content||'Linked annotation remains subject to its original access rules.'}/>} {r.selections?.map(id=><Markdown key={id} content={annotations.find(a=>a.$id===id)?.content||'Selected annotation (restricted)'}/>)}</article>)}{!loading&&!error&&!annotations.length&&!records.length&&<p>No legacy records are visible to this account.</p>}
  </div>;
}
