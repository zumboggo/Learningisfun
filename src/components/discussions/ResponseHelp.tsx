/** Original models: the sample sentence is invented, not attributed to an author. */
export function ResponseHelp({kind}:{kind:'question'|'observation'|'reply'}) {
  const models={
    question:'Why does the writer describe the room as “silent” just after everyone agrees? Could that silence suggest something other than agreement?',
    observation:'The phrase “Everyone nodded. The room stayed silent” makes the agreement feel uncertain. The silence could suggest that nobody wants to be the first to disagree.',
    reply:'Your interpretation of the silence as agreement makes sense, but “stayed silent” also leaves room for hesitation. Perhaps the group agrees publicly without feeling convinced.'
  };
  return <details className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm text-slate-700">
    <summary className="min-h-8 cursor-pointer font-semibold text-blue-800">How to respond?</summary>
    <div className="mt-2 space-y-3">
      <p>Point to the words that led you here—and explain how they support your thinking.</p>
      <p className="text-xs text-slate-500">Practice passage (invented): “Everyone nodded. The room stayed silent.”</p>
      <blockquote className="border-l-2 border-blue-300 pl-3">{models[kind]}</blockquote>
      <p><strong>Develop:</strong> Explain what a detail suggests. “The silence could suggest hesitation, because nobody actually voices agreement.”</p>
      <p><strong>Connect:</strong> Build on an idea. “Your point about pressure helps explain why everyone nods even though nobody speaks.”</p>
      <p><strong>Complicate:</strong> Test another possibility. “Silence might also mean relief. What else in the passage would help us decide?”</p>
      <p>When the author’s name is available, use their <strong>last name</strong>: “Shelley suggests…” rather than “Mary says…”. Otherwise, use “the writer” or “the text”.</p>
      <p className="text-xs">These are possibilities, not a checklist. A precise observation or an unresolved question is valuable too. You do not need every move in every response.</p>
    </div>
  </details>;
}
