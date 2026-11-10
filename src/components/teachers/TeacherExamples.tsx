import {lazy, Suspense, useState} from 'react';

const ExamplePreview = lazy(() => import('./TeacherExamplePreview'));
const examples = {
  game: [
    {id:'today-youre-the-teacher',title:'Today, You’re the Teacher · 今天你是老师',description:'Beginner Mandarin · a teacher learns to ask for help · pinyin, phrase meanings and audio'},
    {id:'a-message-from-tomorrow',title:'A Message from Tomorrow · 来自明天的消息',description:'Beginner Mandarin · a mysterious voice and an unexpected connection · pinyin, phrase meanings and audio'},
    {id: 'the-people-who-told-him-to-wait', title: 'The People Who Told Him to Wait', description: 'Letter from Birmingham Jail · responding to objections'},
    {id: 'one-more-step-toward-peace', title: 'One More Step Toward Peace', description: 'Vietnam War · choices, consequences, and responsibility'},
  ],
  lessons: [
    {id: 'nested-quotes-evidence-v3', title: 'Quoting and nested quotations', description: 'A conversational lesson with visual explanation, short rehearsals, and revision'},
  ],
  texts: [
    {id: '1', title: 'Part 1 · The Teacher and the Tiger', description: 'History of Ethics in China · parallel text and sample discussion'},
    {id: 'please-stop', title: 'Please Stop Improving My Life', description: 'Original PDF · annotated classroom model'},
    {id: 'alchemist', title: 'The World Behind the Alchemist', description: 'Parallel text and discussion · sample questions and replies'},
    {id: 'helplessness', title: 'Learned Helplessness', description: 'The elephant, the rope, and learning to try again'},
  ],
};
export type ExampleSection = keyof typeof examples;

export default function TeacherExamples({section}: {section: ExampleSection}) {
  const [selected, setSelected] = useState<string | null>(null);
  const example = examples[section].find(item => item.id === selected);
  return <section aria-label="Examples for teachers" className="space-y-3 rounded-2xl border border-teal-200 bg-teal-50 p-4">
    <h2 className="text-lg font-bold text-teal-950">Examples for teachers</h2>
    <p className="text-sm text-teal-900">Explore a finished example to see what you can create for your classes.</p>
    {example ? <>
      <button className="rounded-lg border border-teal-700 bg-white px-4 py-2 font-semibold" onClick={() => setSelected(null)}>← All examples</button>
      <Suspense fallback={<p role="status">Opening example…</p>}>
        <ExamplePreview key={example.id} section={section} id={example.id} title={example.title}/>
      </Suspense>
    </> : <div className="grid gap-3 sm:grid-cols-2">{examples[section].map(item => item.id === 'please-stop' ?
      <a key={item.id} href={import.meta.env.BASE_URL + 'teacher-examples/please-stop-improving-my-life.pdf'} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-teal-200 bg-white p-4 text-left hover:border-teal-700">
        <strong className="block">{item.title}</strong><span className="mt-1 block text-sm text-slate-600">{item.description}</span>
        <span className="mt-3 block text-sm font-semibold text-teal-800">Open original PDF →</span>
      </a> : <button key={item.id} onClick={() => setSelected(item.id)} className="rounded-xl border border-teal-200 bg-white p-4 text-left hover:border-teal-700">
        <strong className="block">{item.title}</strong><span className="mt-1 block text-sm text-slate-600">{item.description}</span>
        <span className="mt-3 block text-sm font-semibold text-teal-800">Open example →</span>
      </button>
    )}</div>}
  </section>;
}
