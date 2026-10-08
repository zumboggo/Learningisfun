import { AssignmentRoundProgress } from './AssignmentRoundProgress';
import { useRef, useState } from 'react';
import { Button } from '@/components/common/Button';
import { readingDiscussion, type ReadingDiscussion, type ReplyAssignment } from '@/services/reading-discussion.service';

export function ReplyAssignments({data,textId,classId,busy,mutate,onReply}:{data:ReadingDiscussion;textId:string;classId:string;busy:boolean;mutate:(action:string,fields:Record<string,unknown>)=>Promise<void>;onReply:(id:string)=>void}) {
  const setup=useRef<HTMLDetailsElement>(null);
  const [participants,setParticipants]=useState(data.participation.map(p=>p.id));
  const [preview,setPreview]=useState<ReplyAssignment[]>(),[roundId,setRoundId]=useState<string>(),[requestId,setRequestId]=useState(()=>crypto.randomUUID()),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const shuffle=async(targetRound?:string)=>{setLoading(true);setError('');try{const result=await readingDiscussion<{assignments:ReplyAssignment[]}>('previewReadingAssignments',textId,classId,{studentIds:participants,roundId:targetRound});setPreview(result.assignments);setRequestId(crypto.randomUUID());}catch(e){setError(e instanceof Error?e.message:'Could not prepare assignments');}finally{setLoading(false);}};
  const question=(id:string|null)=>data.posts.find(p=>p.id===id)?.content||'No eligible question';
  const student=(id:string)=>data.participation.find(p=>p.id===id)?.name||'Student no longer in class';
  if(!data.teacher)return <section aria-label="Your assigned question" className="my-3 space-y-2">{data.assignments?.map(a=><div key={`${a.roundId}:${a.studentId}`} className="rounded-xl border border-blue-200 bg-blue-50 p-3"><strong>Your assigned question</strong><p className="mt-1 whitespace-pre-wrap">{question(a.questionId)}</p><p className="text-sm">{a.status==='completed'?'Completed — your reply is part of the discussion.':a.status==='cancelled'?`${a.cancelledReason||'This assignment was cancelled'}. Your teacher can assign another.`:a.status==='gap'?'Your teacher is choosing an eligible question.':'Reply directly to this question to complete your assignment. You can also reply anywhere else.'}</p>{a.status==='pending'&&a.questionId&&<Button size="sm" onClick={()=>onReply(a.questionId!)}>Answer assigned question</Button>}</div>)}</section>;
  return <section aria-label="Assigned questions" className="my-3"><h2 className="font-semibold">Assigned questions</h2>
    {data.rounds?.map((round,index)=><div key={round.id} className="mt-3 rounded-lg bg-slate-50 p-3"><AssignmentRoundProgress index={index} assignments={round.assignments} studentName={student}/>{round.assignments.some(a=>a.status==='cancelled'||a.status==='gap')&&<Button variant="secondary" size="sm" disabled={busy||loading} onClick={()=>{if(setup.current)setup.current.open=true;setRoundId(round.id);void shuffle(round.id);}}>Fill gaps in this round</Button>}</div>)}
    <details ref={setup} className="my-3 rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Assign questions</summary>
    <p className="my-2 text-sm text-slate-600">Optional reply rounds. Each student receives at most one question per round. Assignments favor their voting choices while covering unanswered questions and avoiding their own questions.</p>
    <div className="flex flex-wrap gap-3">{data.participation.map(p=><label key={p.id} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={participants.includes(p.id)} onChange={e=>{setParticipants(current=>e.target.checked?[...current,p.id]:current.filter(id=>id!==p.id));setPreview(undefined);}}/>{p.name}</label>)}</div>
    <Button size="sm" disabled={busy||loading||!participants.length} onClick={()=>{setRoundId(undefined);void shuffle(undefined);}}>Preview new round</Button>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    {preview&&<div className="my-3 space-y-2"><h3 className="font-medium">Randomized preview</h3>{preview.map(a=><p key={a.studentId} className="text-sm"><strong>{student(a.studentId)}</strong> → {question(a.questionId)} {a.status==='completed'?'(completed)':a.status==='gap'?'(needs an eligible question)':''}</p>)}<div className="flex gap-2"><Button variant="secondary" disabled={busy||loading} onClick={()=>void shuffle(roundId)}>Shuffle</Button><Button disabled={busy||loading} onClick={()=>void mutate('publishReadingAssignments',{studentIds:participants,assignments:preview,roundId,requestId}).then(()=>{setPreview(undefined);setRoundId(undefined);}).catch(()=>{})}>Publish assignments</Button></div></div>}
    <p className="my-3 text-sm font-medium">{data.awaitingReplies?.length||0} questions still awaiting replies</p><ul className="space-y-2">{data.awaitingReplies?.map(id=><li key={id} className="text-sm"><span>{question(id)}</span> <Button size="sm" variant="secondary" onClick={()=>onReply(id)}>Reply to question</Button></li>)}</ul>

  </details></section>;
}
