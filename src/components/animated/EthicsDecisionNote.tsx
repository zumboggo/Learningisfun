const ethicsClassId = 'e24ec8d9-21d7-4c32-a30e-08655c2f4e65';

/** Assignment companion content: does not change the published story or saved attempts. */
export default function EthicsDecisionNote({ episodeId, classId }: { episodeId: string; classId: string }) {
  if (episodeId !== 'measure-that-changed-ethics' || classId !== ethicsClassId) return null;
  return <section className="ethics-decision-note" aria-labelledby="ethics-decision-note-title">
    <h2 id="ethics-decision-note-title">Your Decision Note · Ethics and Leadership</h2>
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
