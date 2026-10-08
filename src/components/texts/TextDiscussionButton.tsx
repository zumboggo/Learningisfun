import { Link } from 'react-router-dom';
import { hasReadingDiscussionActivity, type ReadingDiscussionListing } from '@/services/reading-discussion.service';

export function TextDiscussionButton({ discussion }: { discussion?: ReadingDiscussionListing }) {
  if (!discussion?.available) return null;
  const active = hasReadingDiscussionActivity(discussion);
  return <Link
    to={`/discussions/texts/${discussion.textId}/${discussion.classId}`}
    aria-label={`Discussion for ${discussion.title}${active ? ' · questions or replies available' : ''}`}
    title={active ? 'Questions or replies available' : 'No questions or replies yet'}
    className={`mt-2 inline-flex min-h-11 items-center rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700 ${active ? 'border-purple-800 bg-purple-800 text-white hover:bg-purple-900' : 'border-purple-200 bg-purple-100 text-purple-900 hover:bg-purple-200'}`}
  >Discussion{active && <span className="ml-2 h-2 w-2 rounded-full bg-white" aria-hidden="true" />}</Link>;
}
