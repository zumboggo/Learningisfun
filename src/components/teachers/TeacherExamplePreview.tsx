import {Markdown} from '@/components/common/Markdown';
import alchemist from '../../../readings/alchemist-cultural-context/reading.md?raw';
import helplessness from './learned-helplessness.md?raw';
import ChineseDemoPage from '@/pages/ChineseDemoPage';
import {useEffect, useState} from 'react';
import StoryPlayer from '@/components/animated/StoryPlayer';
import {Practice} from '@/pages/LessonsPage';
import type {LessonDefinition} from '@/services/lesson-authoring';
import {executeLearningContent} from '@/services/learning-content.service';
import type {StoryPackage} from '../../../functions/learning-content/src/story-engine.js';
import nestedQuoteExample from './nested-quote-example.json';
import type {ExampleSection} from './TeacherExamples';

const readings = import.meta.glob('../../../readings/history-of-ethics-china/part-*.html', {query: '?raw', import: 'default'});
const images = import.meta.glob('./reading-images/*.webp', {query: '?url', import: 'default', eager: true}) as Record<string, string>;

export default function TeacherExamplePreview({section, id, title}: {section: ExampleSection; id: string; title: string}) {
  if (section === 'game' && ['today-youre-the-teacher','a-message-from-tomorrow'].includes(id)) return <ChineseDemoPage episodeId={id}/>;
  if (section === 'game') return <EpisodeExample id={id}/>;
  if (section === 'texts') return <TextExample id={id} title={title}/>;
  const lesson = nestedQuoteExample.id === id ? nestedQuoteExample : undefined;
  if (!lesson) return <p role="alert">This example could not be found.</p>;
  return <Practice item={{...lesson, classId: 'teacher-example', className: 'Teacher example'}} definition={lesson as unknown as LessonDefinition}/>;
}

export function EpisodeExample({id, cinema = false}: {id: string; cinema?: boolean}) {
  const [data, setData] = useState<{pack: StoryPackage; mediaUrls: Record<string, string>}>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch(import.meta.env.BASE_URL + 'stories/animated/' + id + '/episode.json').then(response => {
        if (!response.ok) throw new Error('The episode could not load. Please reopen the example.');
        return response.json();
      }),
      executeLearningContent<{mediaUrls: Record<string, string>}>({action: 'animatedExampleMedia', id}),
    ]).then(([pack, media]) => {if (active) setData({pack, mediaUrls: media.mediaUrls});})
      .catch(cause => {if (active) setError(cause instanceof Error ? cause.message : 'Could not open example.');});
    return () => {active = false;};
  }, [id]);
  return error ? <p role="alert">{error}</p> : data
    ? <StoryPlayer cinema={cinema} pack={data.pack} mediaUrls={data.mediaUrls} status="Teacher example"/>
    : <p role="status">Opening episode…</p>;
}

function ReadingExample({id, title}: {id: string; title: string}) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const load = readings['../../../readings/history-of-ethics-china/part-' + id + '.html'];
    void load().then(raw => {
      const content = String(raw).replace(/<nav>.*?<\/nav>/s, '').replace(/src="images\/([^"]+)"/g, (_, name) =>
        'src="' + new URL(images['./reading-images/' + name.replace(/\.png$/, '.webp')], window.location.href).href + '"');
      if (active) setHtml(content);
    }).catch(() => {if (active) setError('Could not load the reading. Please reopen the example.');});
    return () => {active = false;};
  }, [id]);
  return error ? <p role="alert">{error}</p> : html
    ? <iframe title={title} srcDoc={html} sandbox="allow-popups allow-popups-to-escape-sandbox" className="h-[75dvh] min-h-96 w-full rounded-xl border bg-white"/>
    : <p role="status">Opening reading…</p>;
}

const sampleDiscussions = {
  '1': [
    {type: 'Interpretation', question: 'How can li help someone develop ren, and when might ritual become an empty performance?', reply: 'The reading says repeated actions train attention. Giving someone time to speak can make care dependable. But the expensive funeral example shows that an outward gesture can display wealth instead of humaneness.', followup: 'So the same ritual might train care or hide its absence. What evidence would help us distinguish the two?'},
    {type: 'Ethical tension', question: 'In the stolen-sheep story, whose needs does family loyalty protect, and whose needs might it neglect?', reply: 'Concealment protects the father and the family relationship, but the sheep’s owner still suffers a loss. I would distinguish caring for a parent from preventing anyone from holding them responsible.', followup: 'Could helping the father return the sheep preserve care while acknowledging the owner’s claim? What might Confucius object to?'},
  ],
  alchemist: [
    {type: 'Interpretation', question: 'How does the history of alchemy change the way we read Santiago’s search for treasure?', reply: 'Alchemy involves both changing material and, in the novel, changing oneself. The history of experiments and practical techniques makes the treasure more than a simple symbol: Santiago also has to learn through action.', followup: 'Where should we draw the line between Coelho’s spiritual use of alchemy and what historical alchemists actually believed?'},
    {type: 'Perspective', question: 'Why does the reading remind us that Tangier already has its own life before Santiago arrives?', reply: 'Santiago experiences it as unfamiliar, but that is his viewpoint. Merchants and residents have their own obligations. The reminder stops us treating North Africa only as scenery for a European traveler’s growth.', followup: 'How might the same encounter look from a merchant’s perspective? Which details in the reading support that change of viewpoint?'},
  ],
};
function TextExample({id, title}: {id: string; title: string}) {
  const [parallel, setParallel] = useState(true);
  const samples = sampleDiscussions[id as keyof typeof sampleDiscussions];
  const content = id === 'helplessness' ? helplessness.replace('/Learningisfun/images/teacher-example-elephant.webp', new URL(import.meta.env.BASE_URL + 'images/teacher-example-elephant.webp', window.location.href).href) : alchemist.replace(/\]\(images\/([^ )]+)\)/g, (_, name) => '](' + new URL(images['./reading-images/alchemist-' + name.replace('.png', '.webp')], window.location.href).href + ')');
  return <section className="space-y-3">
    <h3 className="text-xl font-bold">{title}</h3>
    {samples && <button className="rounded-lg border bg-white px-4 py-2" onClick={() => setParallel(!parallel)}>{parallel ? 'Text only' : 'Text and sample discussion'}</button>}
    <div className={samples && parallel ? 'grid gap-4 lg:grid-cols-2' : ''}>
      <div className="max-h-[75dvh] overflow-auto rounded-xl border bg-white p-4">{id === '1' ? <ReadingExample id={id} title={title}/> : <Markdown content={content}/>}</div>
      {samples && parallel && <aside aria-label="Sample discussion" className="max-h-[75dvh] space-y-4 overflow-auto rounded-xl border bg-white p-4">
        <h4 className="text-lg font-bold">Sample questions and replies</h4>
        <p className="text-sm text-slate-600">Illustrative examples, not student posts or a single correct answer. Notice how replies use the reading and invite further thought.</p>
        {samples.map(sample => <article key={sample.type} className="space-y-3 rounded-lg border p-4"><p className="text-sm font-semibold text-teal-800">{sample.type} question</p><p className="font-semibold">{sample.question}</p><p><strong>Sample reply: </strong>{sample.reply}</p><p><strong>Follow-up reply: </strong>{sample.followup}</p></article>)}
      </aside>}
    </div>
  </section>;
}
