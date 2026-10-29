import {quizScore} from './story-engine.js';

// Immutable save revisions are not separate attempts. Keep only the latest
// revision of each play, but retain the time and score of each quiz submission.
export async function teacherEpisodeRows({records, assignments, students, inRange, storage}) {
  const catalog = new Map(assignments.map(row => [row.$id, JSON.parse(row.dataJson)]));
  const plays = new Map(), packCache = new Map();
  for (const row of records) {
    const a = JSON.parse(row.dataJson);
    if (a.type !== 'animated-attempt' || a.preview || !students.has(row.userId) || !catalog.has(a.assignmentId)) continue;
    const key = JSON.stringify([row.userId, a.assignmentId, a.id]);
    const date = row.$createdAt;
    let play = plays.get(key);
    if (!play) { play = { userId: row.userId, assignmentId: a.assignmentId, latest: a, date, quizzes: new Map() }; plays.set(key, play); }
    if (a.revision > play.latest.revision) play.latest = a;
    if (date > play.date) play.date = date;
    const count = a.quizzes?.length || 0;
    if (count && (!play.quizzes.has(count) || date < play.quizzes.get(count).date)) play.quizzes.set(count, {date, score: a.score});
  }
  const groups = new Map();
  for (const play of plays.values()) {
    const key = JSON.stringify([play.userId, play.assignmentId]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(play);
  }
  const rows = [];
  for (const group of groups.values()) {
    const {userId, assignmentId} = group[0], assignment = catalog.get(assignmentId);
    const lastActivity = group.map(p => p.date).sort().at(-1);
    if (!inRange(lastActivity)) continue;
    const quizzes = [];
    for (const play of group) {
      for (let i = 0; i < (play.latest.quizzes?.length || 0); i++) {
        let entry = play.quizzes.get(i + 1);
        if (!entry || !Number.isFinite(entry.score)) {
          // Older clients can upload multiple quiz tries in one save. Score
          // those answers against the assignment's immutable published package.
          if (!packCache.has(assignment.fileId)) {
            const raw = await storage.getFileDownload({bucketId: 'animated-episodes', fileId: assignment.fileId});
            packCache.set(assignment.fileId, raw?.format ? raw : JSON.parse(Buffer.from(raw).toString()));
          }
          entry = {date: play.quizzes.get(play.latest.quizzes.length)?.date || play.date,
            score: quizScore(packCache.get(assignment.fileId).quiz, play.latest.quizzes[i])};
        }
        quizzes.push({...entry, index: i, playId: play.latest.id});
      }
    }
    quizzes.sort((a,b) => a.date.localeCompare(b.date) || a.playId.localeCompare(b.playId) || a.index-b.index);
    rows.push({userId, assignmentId, title: assignment.title, assignedDate: assignment.date,
      firstScore: quizzes[0]?.score ?? null, latestScore: quizzes.at(-1)?.score ?? null,
      bestScore: quizzes.length ? Math.max(...quizzes.map(q=>q.score)) : null,
      quizTries: quizzes.length, plays: group.length, complete: group.some(p=>p.latest.complete),
      assessmentMode: assignment.assessmentMode || 'quiz', lastActivity});
  }
  return rows.sort((a,b) => b.lastActivity.localeCompare(a.lastActivity));
}
