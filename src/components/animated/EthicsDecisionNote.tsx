import { useId, useState, type ReactNode } from 'react';

const ethicsClassId = 'e24ec8d9-21d7-4c32-a30e-08655c2f4e65';

type Assignment = { episodeId: string; classId: string };
const hasDecisionNote = ({ episodeId, classId }: Assignment) => episodeId === 'measure-that-changed-ethics' && classId === ethicsClassId;

export function EthicsAssignmentAccess({ episodeId, classId, children }: Assignment & { children: ReactNode }) {
  const [showQuestions, setShowQuestions] = useState(false);
  const questionsId = useId();
  if (!hasDecisionNote({ episodeId, classId })) return <>{children}</>;
  return <>
    <button className="mb-4 min-h-11 rounded-lg border border-teal-700 bg-teal-50 px-4 py-3 font-semibold text-teal-900" aria-expanded={showQuestions} aria-controls={questionsId} onClick={() => setShowQuestions(value => !value)}>
      {showQuestions ? 'Back to episode' : 'Go to assignment questions'}
    </button>
    <div id={questionsId} hidden={!showQuestions}>
      {showQuestions && <EthicsDecisionNote episodeId={episodeId} classId={classId} />}
    </div>
    <div hidden={showQuestions}>{children}</div>
  </>;
}

/** Assignment companion content: does not change the published story or saved attempts. */
export default function EthicsDecisionNote({ episodeId, classId }: Assignment) {
  const titleId = useId();
  if (!hasDecisionNote({ episodeId, classId })) return null;
  return <section className="ethics-decision-note" aria-labelledby={titleId}>
    <h2 id={titleId}>Your Decision Note · Ethics and Leadership</h2>
    <p>Take 8–10 minutes. Answer these five questions in your episode assignment, using about 80–120 words total or five concise bullets. Keep your original response for later reconsideration.</p>
    <p><strong>Remember the case:</strong> Seneb gives extra grain to Iset, whom he knows, but records only the usual amount. Kha’s household also needs help. The reserve is small, so helping one household affects what remains for others.</p>
    <ol>
      <li><strong>Choose:</strong> What should Seneb do about the extra grain and the inaccurate account?</li>
      <li><strong>Explain:</strong> Give your strongest reason and one specific episode detail. How does Seneb’s action fit—or conflict with—his stated value of ma’at: truth, justice and right order?</li>
      <li><strong>Explain the other side:</strong> What is the strongest reasonable argument for another choice?</li>
      <li><strong>State a principle:</strong> What general rule supports your judgement?</li>
      <li><strong>Test it:</strong> What change to the situation might make you reconsider that rule? Explain why it matters. You may keep your rule if you can defend it against the challenge.</li>
    </ol>
    <details><summary>Sentence starters and a possible test</summary>
      <p>“Seneb should…” · “This detail matters because…” · “His action fits/conflicts with his value because…” · “Someone could reasonably disagree because…” · “My rule becomes difficult when…”</p>
      <p>Possible principle starter: “A fair exception should…” Complete your own rule.</p>
      <p>Hypothetical test: suppose there is enough extra grain for only one of the two households. What would matter to your rule? You can also choose a different change.</p>
    </details>
    <p>This writing is separate from the four-question knowledge check and does not block finishing the game. Your task is to support a judgement, not to agree with one preferred answer.</p>
  </section>;
}
