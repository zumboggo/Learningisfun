// Chapter order is independent of assignment dates and database insertion order.
const quixote = [
 ['quixote-sidekick-animated', 'A Knight Needs a Sidekick', 'Chapter 1'],
 ['quixote-inn-animated', 'The Castle That Served Supper', 'Chapters 2–3'],
 ['quixote-promise-animated', 'The Promise Left Behind', 'Chapters 4–5'],
 ['quixote-door-animated', 'The Door That Disappeared', 'Chapters 6–7'],
 ['quixote-windmills-animated', 'The Giants That Were Mills', 'Chapter 8'],
];
export function episodeTopic(episode) {
 if(episode.topic)return {topic:episode.topic,order:99,chapter:''};
 const index=quixote.findIndex(([id,title])=>episode.id===id||episode.title===title);
 if(index>=0)return {topic:'Don Quixote',order:index,chapter:quixote[index][2]};
 if(episode.unitId==='world-literature-quixote'||episode.id?.startsWith('quixote-'))return {topic:'Don Quixote',order:99,chapter:''};
 if(episode.classId==='e24ec8d9-21d7-4c32-a30e-08655c2f4e65')return {topic:'The Teaching Stone',order:99,chapter:''};
 if(episode.classId==='88421c66-9cda-4002-8e15-086312b7805e')return {topic:'Language and Identity',order:99,chapter:''};
 return {topic:episode.topic||'More adventures',order:99,chapter:''};
}
