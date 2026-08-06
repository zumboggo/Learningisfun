import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';

export function TeacherSetupPage() {
  const { user } = useAuth();
  const setup = useLiveQuery(async () => {
    if (!user) return null;
    const classes = await db.classes.where('teacherId').equals(user.$id).toArray();
    const classIds = classes.map(cls => cls.$id);
    const rosterCount = classIds.length
      ? await db.class_members.where('classId').anyOf(classIds).and(member => member.role === 'student').count()
      : 0;
    const readingCount = 0;
    const deckCount = classIds.length
      ? await db.deck_assignments.where('classId').anyOf(classIds).count()
      : 0;
    const sessionCount = classIds.length
      ? await db.class_sessions.where('classId').anyOf(classIds).count()
      : 0;
    return { classes, rosterCount, readingCount, deckCount, sessionCount };
  }, [user?.$id]);

  const firstClass = setup?.classes[0];
  const steps = [
    {
      title: 'Create a class',
      detail: 'This gives students a home base, join code, and reports.',
      done: Boolean(firstClass),
      to: firstClass ? `/classes/${firstClass.$id}` : '/classes/new',
      action: firstClass ? 'Open class' : 'Create class',
    },
    {
      title: 'Import roster',
      detail: 'Upload a CSV of names and emails from the class page.',
      done: Boolean(setup?.rosterCount),
      to: firstClass ? `/classes/${firstClass.$id}` : '/classes/new',
      action: 'Open roster tools',
    },
    {
      title: 'Build a lesson',
      detail: 'Paste the text, add a prompt, import vocab, and open a class period.',
      done: Boolean(setup?.readingCount),
      to: '/lessons/new',
      action: 'New lesson',
    },
    {
      title: 'Assign vocab CSV',
      detail: 'The lesson builder can create and assign the vocab deck in the same flow.',
      done: Boolean(setup?.deckCount),
      to: '/lessons/new',
      action: 'Add vocab',
    },
    {
      title: 'Teach the first period',
      detail: 'Use the During Class panel to collect questions, observations, notes, and responses.',
      done: Boolean(setup?.sessionCount),
      to: firstClass ? `/classes/${firstClass.$id}` : '/classes/new',
      action: 'Open class periods',
    },
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teacher setup</h1>
          <p className="text-sm text-gray-500">Follow this path to get from empty app to a teachable lesson.</p>
        </div>
        <Link to="/lessons/new">
          <Button>Build lesson</Button>
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => (
          <Card key={step.title} className="h-full">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                {index + 1}
              </span>
              <StatusBadge status={step.done ? 'ready' : 'draft'} label={step.done ? 'Done' : 'Next'} />
            </div>
            <h2 className="font-semibold">{step.title}</h2>
            <p className="mt-2 min-h-[64px] text-sm text-gray-500">{step.detail}</p>
            <Link to={step.to} className="mt-4 block">
              <Button size="sm" variant={step.done ? 'secondary' : 'primary'} className="w-full">
                {step.action}
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-semibold mb-3">Suggested first lesson flow</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <MiniStep title="Before class" body="Paste the text, upload vocab, and set vote rules." />
          <MiniStep title="During class" body="Read paragraph by paragraph, collect observations, and sort student questions." />
          <MiniStep title="After class" body="Preview the study note, then publish selected questions, paragraph observations, and vocab." />
        </div>
      </Card>
    </div>
  );
}

function MiniStep({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{body}</p>
    </div>
  );
}
