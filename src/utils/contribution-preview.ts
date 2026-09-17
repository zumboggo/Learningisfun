// Keep the original Markdown intact when expanded, including links and quotations.
export function contributionPreview(text:string) {
  const sentences=[...text.matchAll(/[.!?](?:["”’']?)(?=\s|$)/g)];
  const sentenceEnd=sentences.length>5 ? sentences[4].index!+sentences[4][0].length : text.length;
  let end=Math.min(sentenceEnd,750);
  if(end<text.length&&end===750)end=Math.max(500,text.lastIndexOf(' ',750));
  return end<text.length ? text.slice(0,end).trimEnd()+'…' : text;
}
