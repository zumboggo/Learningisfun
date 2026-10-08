import { Button } from '@/components/common/Button';
import type { ReadingDiscussion } from '@/services/reading-discussion.service';

// Preserve writing saved before direct posting replaced the private notebook.
export function QuestionNotebook({data,busy,mutate}:{data:ReadingDiscussion;storageKey:string;busy:boolean;mutate:(action:string,fields:Record<string,unknown>)=>Promise<void>}) {
  return <details className="my-3 rounded-xl border p-3">
    <summary>Previously saved questions ({data.notebook?.length || 0})</summary>
    <p className="my-2 text-sm">These older questions have not been shared yet. Post each one to share it with your class.</p>
    {data.notebook?.map(question=><div className="my-2 rounded-lg border p-3" key={question.id}>
      <p className="mb-2 whitespace-pre-wrap">{question.content}</p>
      <Button disabled={busy} onClick={()=>void mutate('publishReadingQuestions',{draftIds:[question.id]}).catch(()=>{})}>Post question to class</Button>
    </div>)}
  </details>;
}
