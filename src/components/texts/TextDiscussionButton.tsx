import { Link } from 'react-router-dom';
import { hasReadingDiscussionActivity, type ReadingDiscussionListing } from '@/services/reading-discussion.service';

export function TextDiscussionButton({ discussion, compact = false }: { discussion?: ReadingDiscussionListing; compact?: boolean }) {
  if (!discussion?.available) return null;
  const active = hasReadingDiscussionActivity(discussion);
  return <Link
    to={`/discussions/texts/${discussion.textId}/${discussion.classId}`}
    aria-label={`Discussion for ${discussion.title}${active ? ' · questions or replies available' : ''}`}
    title={discussion.questionCount === undefined ? 'Open discussion' : active ? 'Questions or replies available' : 'No questions or replies yet'}
    className={`${compact ? 'shrink-0 inline-flex h-9 w-9 justify-center' : 'mt-2 inline-flex min-h-11 px-3 py-2'} items-center rounded-lg border text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700 ${active ? 'border-purple-800 bg-purple-800 text-white hover:bg-purple-900' : 'border-purple-200 bg-purple-100 text-purple-900 hover:bg-purple-200'}`}
  >{compact ? <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2v-9.5A8.5 8.5 0 0 1 10.5 4h2A8.5 8.5 0 0 1 21 11.5Z"/></svg> : 'Discussion'}{active && <span className="ml-2 h-2 w-2 rounded-full bg-white" aria-hidden="true" />}</Link>;
}
