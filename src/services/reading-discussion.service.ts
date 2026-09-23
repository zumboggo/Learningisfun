import { executeLearningContent } from './learning-content.service';
export type ReadingCategory = 'thought'|'question'|'connection';
export const readingCategories: Record<ReadingCategory, string> = { thought: 'Thoughts', question: 'Questions', connection: 'Connections & Insights' };
export interface ReadingDiscussionPost {
  id: string; parentId: string|null; category: ReadingCategory; content: string; quotation: string; paragraph: number|null;
  label: string; teacher: boolean; mine: boolean; authorId?: string; username?: string; createdAt: string; updatedAt?: string;
  hidden: boolean; locked: boolean; pinned: boolean; score: number; voted: boolean; reports?: {id:string;reason:string}[];
}
export interface ReadingDiscussion {
  title:string; className:string; teacher:boolean; showStudentNames?:boolean; canWrite:boolean; posts:ReadingDiscussionPost[];
  participation:{id:string;name:string;thought:number;question:number;connection:number;replies:number}[];
}
export interface ReadingDiscussionListing { id:string;textId:string;classId:string;title:string;className:string;date:string;available:boolean }
export const readingDiscussion = <T>(action:string, textId:string, classId:string, fields:Record<string,unknown>={}) => executeLearningContent<T>({action,textId,classId,...fields});
export function readingWeek(date:string):string {
  const d = new Date(`${date.slice(0,10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return 'Unscheduled';
  d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7); return d.toISOString().slice(0,10);
}
export function sortedReadingPosts(posts:ReadingDiscussionPost[], category:ReadingCategory, sort:'new'|'top'|'unanswered') {
  return posts.filter(p=>!p.parentId&&p.category===category&&(sort!=='unanswered'||!posts.some(reply=>reply.parentId===p.id&&!reply.hidden)))
    .sort((a,b)=>(sort==='top'?b.score-a.score:0)||Number(b.pinned)-Number(a.pinned)||b.createdAt.localeCompare(a.createdAt));
}

export function topReadingReplies(posts: ReadingDiscussionPost[], parentId: string) {
  return posts.filter(post => post.parentId === parentId)
    .sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export function currentReadingWeek(now = new Date()) {
  // Match the school calendar, rather than the browser's timezone.
  const schoolDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return readingWeek(schoolDate);
}
