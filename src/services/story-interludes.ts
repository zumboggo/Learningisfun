/** Media stays outside immutable packages. Each interlude consumes one legal narration beat. */
export type StoryInterlude = {
 kind:'video';title:string;src:string;poster:string;captions:string;description:string;source:string;sourceLabel:string;
} | {kind:'crawl';title:string;kicker:string;paragraphs:string[];seconds:number};
const root=import.meta.env.BASE_URL+'stories/shared/birmingham-letter/';
export const STORY_INTERLUDES:Record<string,StoryInterlude>={
 birmingham_opening_v1:{kind:'video',title:'The People Who Told Him to Wait',src:root+'opening-v2.mp4',poster:root+'opening-v2.poster.jpg',captions:root+'opening-v2.vtt',description:'“Justice too long delayed is justice denied.” King’s own later reading, over an AI-generated reconstruction of him writing in jail. This is not footage or audio recorded in the cell.',source:'https://okra.stanford.edu/media/audio/630416001.mp3#t=767.9,773.35',sourceLabel:'Original recording · Stanford King Institute'},
 birmingham_context_v1:{kind:'crawl',title:'The People Who Told Him to Wait',kicker:'Birmingham, Alabama · April 1963',seconds:38,paragraphs:[
 'Racial segregation denies Black residents equal access and opportunity.',
 'Local activists and Martin Luther King Jr.’s organization campaign for change through nonviolent protest.',
 'Arrested on April 12, King encounters criticism from eight white religious leaders. They urge restraint and negotiation. He begins a reply in jail.',
 'How can an argument answer people who say the method undermines the goal?'
 ]}
};
export function storyInterludeCursors(story:{nodes:{type:string}[];labels:Record<string,number>}|undefined):Record<number,StoryInterlude>{
 const result:Record<number,StoryInterlude>={};if(!story)return result;
 for(const [label,media] of Object.entries(STORY_INTERLUDES)){
  const start=story.labels[label];if(start===undefined)continue;
  const offset=story.nodes.slice(start+1).findIndex(n=>['say','choice','act','end'].includes(n.type));
  if(offset>=0&&story.nodes[start+1+offset].type==='say')result[start+1+offset]=media;
 }
 return result;
}
