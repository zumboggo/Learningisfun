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
  if (section === 'game') return <EpisodeExample id={id}/>;
  if (section === 'texts') return <ReadingExample id={id} title={title}/>;
  const lesson = nestedQuoteExample.id === id ? nestedQuoteExample : undefined;
  if (!lesson) return <p role="alert">This example could not be found.</p>;
  return <Practice item={{...lesson, classId: 'teacher-example', className: 'Teacher example'}} definition={lesson as unknown as LessonDefinition}/>;
}

function EpisodeExample({id}: {id: string}) {
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
    ? <StoryPlayer pack={data.pack} mediaUrls={data.mediaUrls} status="Teacher example"/>
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
