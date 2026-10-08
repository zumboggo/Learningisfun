import { createHash } from 'node:crypto';

// Options are stable across refreshes/devices, private to each student, and
// spread across the question pool before showing a question a second time.
export function votingBallot(session, studentId, questions) {
  const choices = session.ballots.find(b => b.studentId === studentId)?.choices || [];
  const pool = questions.filter(q => session.questionIds.includes(q.id) && q.authorId !== studentId);
  const totalRounds = Math.min(session.roundCount, pool.length);
  const shown = new Set(), chosen = new Set();
  let options = [];
  for (let step = 0; step <= choices.length && step < totalRounds; step++) {
    const ranked = pool.filter(q => !chosen.has(q.id)).sort((a, b) => {
      const rank = id => createHash('sha256').update(JSON.stringify([session.id, studentId, step, id])).digest('hex');
      return Number(shown.has(a.id)) - Number(shown.has(b.id)) || rank(a.id).localeCompare(rank(b.id));
    });
    options = ranked.slice(0, session.questionsPerRound).map(q => q.id);
    options.forEach(id => shown.add(id));
    if (choices[step]) chosen.add(choices[step]);
  }
  const completed = choices.length >= totalRounds;
  return { sessionId: session.id, active: session.active, totalRounds, questionsPerRound: session.questionsPerRound,
    completedRounds: choices.length, completed, choices, questionIds: session.active && !completed ? options : [] };
}

// Minimum-cost flow gives maximum distinct coverage, then maximum unanswered
// coverage, then as many students as possible a question they chose in voting.
// Repeated assignments remain possible when there are more students than questions.
export function allocatePreferredQuestions(students, questions, preferences, random = Math.random) {
  const shuffled = [...students];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const ranked = [...questions].sort((a,b) => Number(b.unanswered)-Number(a.unanswered) || b.score-a.score || a.id.localeCompare(b.id));
  const source = 0, questionStart = 1 + shuffled.length, sink = questionStart + ranked.length;
  const graph = Array.from({ length: sink + 1 }, () => []);
  const edge = (from, to, capacity, cost) => {
    const forward = { to, capacity, cost, reverse: graph[to].length };
    const reverse = { to: from, capacity: 0, cost: -cost, reverse: graph[from].length };
    graph[from].push(forward); graph[to].push(reverse);
    return forward;
  };
  const links = new Map();
  shuffled.forEach((student, index) => {
    edge(source, index + 1, 1, 0);
    const choices = new Set(preferences.get(student) || []);
    links.set(student, ranked.flatMap((q, j) => q.authorId === student ? [] : [{ question: q, edge: edge(index + 1, questionStart + j, 1, choices.has(q.id) ? -1 : 0) }]));
  });
  const weight = students.length + 1;
  ranked.forEach((q, j) => {
    edge(questionStart + j, sink, 1, -weight * weight - (q.unanswered ? weight : 0));
    edge(questionStart + j, sink, students.length, 0);
  });
  for (;;) {
    const distances = Array(graph.length).fill(Infinity), previous = Array(graph.length);
    const queued = new Set([source]), queue = [source]; distances[source] = 0;
    for (let head = 0; head < queue.length; head++) {
      const from = queue[head]; queued.delete(from);
      graph[from].forEach((e, index) => {
        if (e.capacity > 0 && distances[e.to] > distances[from] + e.cost) {
          distances[e.to] = distances[from] + e.cost; previous[e.to] = [from, index];
          if (!queued.has(e.to)) { queue.push(e.to); queued.add(e.to); }
        }
      });
    }
    if (!previous[sink]) break;
    for (let to = sink; to !== source;) {
      const [from, index] = previous[to], e = graph[from][index];
      e.capacity--; graph[to][e.reverse].capacity++; to = from;
    }
  }
  return students.map(studentId => {
    const match = links.get(studentId).find(link => link.edge.capacity === 0);
    return { studentId, questionId: match?.question.id || null, status: match ? 'pending' : 'gap' };
  });
}
