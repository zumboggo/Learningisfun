import {useEffect,useState,type FormEvent} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/common/Button';
import {Card} from '@/components/common/Card';
import {FAMILY_CONTACT_CLASS_ID,FAMILY_CONTACT_FIELDS,blankFamilyContacts,validateFamilyContacts,familyContactsTsv,readFamilyContacts,saveFamilyContacts,type FamilyContactData,type FamilyContactResponse} from '@/services/family-contacts.service';

export default function FamilyContactsPage(){
  const {classId}=useParams();
  const {user,isTeacher}=useAuth();
  if(classId!==FAMILY_CONTACT_CLASS_ID)return <p role="alert" className="p-6">This form is only for Gr. 9 Boys Advisory.</p>;
  // Remount on account or teacher-mode changes, clearing all private state.
  return <Contacts key={`${user?.$id}:${isTeacher}`} classId={classId} teacherMode={isTeacher}/>;
}
function Contacts({classId,teacherMode}:{classId:string;teacherMode:boolean}){
  const [data,setData]=useState<FamilyContactData|null>(null);
  const [error,setError]=useState('');
  const [reload,setReload]=useState(0);
  useEffect(()=>{
    let active=true;
    readFamilyContacts(classId,!teacherMode).then(result=>{if(active)setData(result)}).catch(()=>{if(active)setError('Could not open the form. Check your connection and that you belong to Gr. 9 Boys Advisory, then try again.');});
    return ()=>{active=false};
  },[classId,teacherMode,reload]);
  const refresh=()=>{setError('');setData(null);setReload(n=>n+1)};
  return <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
    <Link to={`/classes/${classId}`} className="text-sm text-blue-700 hover:underline">← Gr. 9 Boys Advisory</Link>
    <div><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Grade 9 · 2026–27</p><h1 className="mt-1 text-2xl font-bold">Family contact form</h1></div>
    {error?<Card><p role="alert" className="text-red-700">{error}</p><Button className="mt-3" onClick={refresh}>Try again</Button></Card>:!data?<p role="status">Connecting securely…</p>:data.teacher?<TeacherResponses rows={data.rows} refresh={refresh}/>:<StudentForm key={reload} classId={classId} existing={data.response} preview={Boolean(data.preview)}/>}
  </div>;
}
function StudentForm({classId,existing,preview}:{classId:string;existing:FamilyContactResponse|null;preview:boolean}){
  const [values,setValues]=useState<string[]>(existing?.values||blankFamilyContacts());
  const [review,setReview]=useState(false);
  const [confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [saved,setSaved]=useState(false);
  const [updatedAt,setUpdatedAt]=useState(existing?.updatedAt||'');
  const [error,setError]=useState('');
  function check(e:FormEvent){e.preventDefault();setError('');try{setValues(validateFamilyContacts(values));setReview(true);setConfirmed(false);window.scrollTo(0,0)}catch(cause){setError(cause instanceof Error?cause.message:'Please check your details.')}}
  async function submit(){
    if(!confirmed||preview)return;
    setBusy(true);setError('');
    try{const result=await saveFamilyContacts(classId,values);setUpdatedAt(result.response.updatedAt);setValues(blankFamilyContacts());setSaved(true);setReview(false)}catch{setError('Your details were not confirmed as saved. Check your connection and try again. Your entries are still here.');}finally{setBusy(false)}
  }
  return <>
    <Card className="!border-blue-200 !bg-blue-50"><p className="font-semibold">Your response is private.</p><p className="mt-1 text-sm">Only you and your advisory teacher can access your response. Classmates cannot view it. This form uses Learning is Fun’s existing Appwrite storage; entries are not sent to an AI service.</p><p className="mt-2 text-sm">An internet connection is required. Details are not saved in the app’s offline storage.</p></Card>
    {preview&&<p role="status" className="rounded-xl bg-amber-50 p-4 text-sm">Student preview · You can review the form, but teacher accounts cannot submit a student response.</p>}
    {saved?<Card><h2 className="text-xl font-semibold">Your details are saved.</h2><p className="mt-2">Your teacher can now view them. You can close this page.</p><p className="mt-1 text-sm text-gray-500">Saved {new Date(updatedAt).toLocaleString()}</p><Link to={`/classes/${classId}`} className="mt-4 inline-block text-blue-700 underline">Return to your class</Link><p className="mt-3 text-sm">Need to correct something? Reopen Family contact form from your class to update your own response.</p></Card>:<>
      <p className="text-gray-600">Copy the information from your physical card. Leave optional fields blank if they are not on the card. Grade 9 is already filled in.</p>
      {updatedAt&&<p className="text-sm text-gray-500">You already submitted this form on {new Date(updatedAt).toLocaleString()}. Saving again updates your response.</p>}
      <form autoComplete="off" onSubmit={check} className="space-y-5">
        {review?<Card><h2 className="text-lg font-semibold">Check against your card</h2><dl className="mt-3 divide-y divide-gray-100">{FAMILY_CONTACT_FIELDS.map((field,i)=><div className="grid gap-1 py-3 sm:grid-cols-2" key={field.column}><dt className="text-sm text-gray-500">{field.label}</dt><dd className="break-words">{values[i]||'—'}</dd></div>)}</dl><label className="mt-5 flex items-start gap-3"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-1 h-5 w-5"/>I checked these details against my physical card.</label><div className="mt-5 flex flex-wrap gap-3"><Button type="button" variant="secondary" disabled={busy} onClick={()=>setReview(false)}>Back to edit</Button><Button type="button" disabled={!confirmed||preview} loading={busy} onClick={()=>void submit()}>Save my details</Button></div></Card>:<>
          {[{title:'About you',start:1,end:5},{title:'Parent 1',start:5,end:8},{title:'Parent 2',start:8,end:11}].map(section=><Card key={section.title}><h2 className="mb-4 text-lg font-semibold">{section.title}</h2>{section.start===8&&<p className="mb-4 text-sm text-gray-500">Optional. Leave blank if no second parent is listed.</p>}<div className="grid gap-4 sm:grid-cols-2">{FAMILY_CONTACT_FIELDS.slice(section.start,section.end).map((field,j)=>{const i=section.start+j;return <label key={field.column} className={`text-sm font-medium ${[1,5,8].includes(i)?'sm:col-span-2':''}`}>{field.label}{field.required?' *':''}<input className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white p-3 text-base text-gray-950 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" type={field.type||'text'} value={values[i]} required={field.required} maxLength={200} autoComplete="off" onChange={e=>{setValues(old=>old.map((value,n)=>n===i?e.target.value:value));setConfirmed(false)}}/></label>})}</div></Card>)}
          <div className="flex items-center justify-between gap-4"><span className="text-sm text-gray-500">* Required</span><Button type="submit">Review my details →</Button></div>
        </>}
        {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      </form>
    </>}
  </>;
}
function TeacherResponses({rows,refresh}:{rows:FamilyContactResponse[];refresh:()=>void}){
  const [message,setMessage]=useState('');
  const [fallback,setFallback]=useState(false);
  const sorted=[...rows].sort((a,b)=>a.values[1].localeCompare(b.values[1]));
  async function copy(){try{await navigator.clipboard.writeText(familyContactsTsv(sorted));setMessage('Copied. Paste into cell A2 on the “9th” sheet.');setFallback(false)}catch{setFallback(true);setMessage('Select and copy the rows below, then paste into A2 on the “9th” sheet.')}}
  return <>
    <Card><div className="flex flex-wrap items-center gap-3"><h2 className="mr-auto text-lg font-semibold">{rows.length} {rows.length===1?'response':'responses'}</h2><Button variant="secondary" onClick={refresh}>Refresh responses</Button><Button disabled={!rows.length} onClick={()=>void copy()}>Copy rows for Excel</Button></div><p className="mt-3 text-sm text-gray-600">Teacher mode · One response per student account. Copy and paste into <strong>A2 on the “9th” sheet</strong>. Columns A–K match the original spreadsheet. Phone numbers paste as text, preserving country codes and leading zeros.</p><p className="mt-2 text-sm text-gray-500">This private table is loaded only when you open it. It is not part of class sync or offline storage.</p></Card>
    {message&&<p role="status" className="rounded-lg bg-blue-50 p-3 text-blue-900">{message}</p>}
    {fallback&&<label className="block text-sm font-medium">Rows for Excel<textarea readOnly rows={6} className="mt-2 w-full rounded-lg border p-3 font-mono" value={familyContactsTsv(sorted)} onFocus={e=>e.currentTarget.select()}/></label>}
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white"><table className="w-full whitespace-nowrap text-left text-sm"><caption className="sr-only">Private family contact responses for Gr. 9 Boys Advisory</caption><thead className="bg-gray-50"><tr>{FAMILY_CONTACT_FIELDS.map(field=><th scope="col" key={field.column} className="p-3">{field.column}</th>)}<th scope="col" className="p-3">Updated</th></tr></thead><tbody>{sorted.map(row=><tr key={row.userId} className="border-t">{row.values.map((value,i)=><td key={i} className="p-3">{value}</td>)}<td className="p-3">{new Date(row.updatedAt).toLocaleString()}</td></tr>)}</tbody></table>{!rows.length&&<p className="p-6 text-gray-500">No responses yet. Students can open Family contact form from Gr. 9 Boys Advisory.</p>}</div>
  </>;
}
