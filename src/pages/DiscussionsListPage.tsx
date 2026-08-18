import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import { syncMyClassSessionsFromServer } from '@/services/class-session.service';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { classLabel } from '@/utils/helpers';
import type { ClassSession } from '@/types';
import { Modal } from '@/components/common/Modal';
import { createClassSession } from '@/services/class-session.service';

interface DiscussionSessionRow {
  session: ClassSession;
  className: string;
  questionCount: number;
}

export function DiscussionsListPage() {
  const { user, isTeacher } = useAuth();
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'all'|'qft'|'question'|'text'>('all');

  // Discussions are created on the teacher's device; this is what brings them
  // down to everyone else's.
  const userId = user?.$id;
  useEffect(() => {
    if (!userId) return;
    void syncMyClassSessionsFromServer(userId);
  }, [userId]);

  const rows = useLiveQuery(async (): Promise<DiscussionSessionRow[]> => {
    if (!user) return [];

    const classMap = new Map<string, string>();
    let sessionClassIds: string[];

    if (isTeacher) {
      const classes = await db.classes.where('teacherId').equals(user.$id).toArray();
      for (const cls of classes) classMap.set(cls.$id, classLabel(cls));
      sessionClassIds = classes.map(c => c.$id);
    } else {
      const memberships = await db.class_members.where('userId').equals(user.$id).toArray();
      const classIds = memberships.map(m => m.classId);
      if (classIds.length === 0) return [];
      const classes = await db.classes.where('$id').anyOf(classIds).toArray();
      for (const cls of classes) classMap.set(cls.$id, classLabel(cls));
      sessionClassIds = classIds;
    }

    if (sessionClassIds.length === 0) return [];

    let sessions: ClassSession[];
    if (isTeacher) {
      sessions = await db.class_sessions.where('classId').anyOf(sessionClassIds).toArray();
    } else {
      sessions = await db.class_sessions
        .where('classId')
        .anyOf(sessionClassIds)
        .and(s => s.status === 'active' || s.status === 'published')
        .toArray();
    }

    sessions = sessions.filter(s => s.discussionType !== 'notes' && (filter === 'all' || (s.discussionType || 'qft') === filter));
    sessions.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

    const sessionIds = sessions.map(s => s.$id);
    const questionCountBySession = new Map<string, number>();

    if (sessionIds.length > 0) {
      const allQuestions = await db.discussion_questions
        .where('classSessionId')
        .anyOf(sessionIds)
        .toArray();
      for (const q of allQuestions) {
        questionCountBySession.set(q.classSessionId, (questionCountBySession.get(q.classSessionId) || 0) + 1);
      }
    }

    return sessions.map(session => ({
      session,
      className: classMap.get(session.classId) || 'Unknown class',
      questionCount: questionCountBySession.get(session.$id) || 0,
    }));
  }, [user?.$id, isTeacher, filter]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Discussions</h1>
        {isTeacher && (
          <Button size="sm" onClick={() => setCreating(true)}>Start discussion</Button>
        )}
      </div>
      <div className="mb-4 flex gap-2 overflow-auto">{(['all','text','question','qft'] as const).map(type => <Button key={type} size="sm" variant={filter===type?'primary':'secondary'} onClick={()=>setFilter(type)}>{type==='all'?'All':type==='qft'?'QFT':type[0].toUpperCase()+type.slice(1)}</Button>)}</div>

      {rows && rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map(row => (
            <Link key={row.session.$id} to={`/discussions/${row.session.$id}`}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{row.session.title}</h3>
                    <p className="text-sm text-gray-500">
                      {row.className} &middot; {row.session.sessionDate}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(row.session.discussionType || 'qft') === 'text' ? 'Text discussion' : (row.session.discussionType || 'qft') === 'question' ? 'Open question' : `${row.questionCount} QFT question${row.questionCount !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <StatusBadge status={row.session.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No discussions yet"
          message={isTeacher ? 'Start a discussion from one of your classes to begin collecting questions.' : "Your teacher hasn't started any discussions yet."}
          action={isTeacher ? (
            <Link to="/classes">
              <Button size="sm">Go to classes</Button>
            </Link>
          ) : undefined}
        />
      )}
      {creating && user && <CreateDiscussionModal teacherId={user.$id} onClose={() => setCreating(false)} />}
    </div>
  );
}

function CreateDiscussionModal({teacherId,onClose}:{teacherId:string;onClose:()=>void}) {
  const [type,setType]=useState<'text'|'qft'>('qft'),[classId,setClassId]=useState(''),[textId,setTextId]=useState(''),[title,setTitle]=useState(''),[prompt,setPrompt]=useState('');
  const classes=useLiveQuery(()=>db.classes.where('teacherId').equals(teacherId).toArray(),[teacherId]);
  const selectedClassId=classId||classes?.[0]?.$id||'';
  const texts=useLiveQuery(async()=>{if(!selectedClassId)return [];const ids=(await db.text_assignments.where('classId').equals(selectedClassId).toArray()).map(a=>a.textId);return ids.length?db.texts.where('$id').anyOf(ids).toArray():[]},[selectedClassId]);
  return <Modal open onClose={onClose} title="Start discussion"><div className="space-y-4"><div className="grid grid-cols-2 gap-2"><Button size="sm" variant={type==='qft'?'primary':'secondary'} onClick={()=>setType('qft')}>Topic + questions</Button><Button size="sm" variant={type==='text'?'primary':'secondary'} onClick={()=>setType('text')}>Uploaded text</Button></div><select className={input} value={selectedClassId} onChange={e=>setClassId(e.target.value)}>{classes?.map(c=><option key={c.$id} value={c.$id}>{classLabel(c)}</option>)}</select>{type==='text'&&<select className={input} value={textId} onChange={e=>setTextId(e.target.value)}><option value="">Choose a text</option>{texts?.map(t=><option key={t.$id} value={t.$id}>{t.title}</option>)}</select>}<input className={input} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Overall discussion topic"/><textarea className={input} rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={type==='qft'?'Broad focus or context for the questions teachers and students will add':'Optional focus for discussing this text'}/><Button disabled={!selectedClassId||!title.trim()||(type==='text'&&!textId)} onClick={()=>void createClassSession(selectedClassId,teacherId,{title,discussionType:type,textId:type==='text'?textId:null,promptMarkdown:prompt}).then(onClose)}>Create discussion</Button></div></Modal>;
}
const input='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';
