/** Media stays outside immutable packages. Each interlude consumes one legal narration beat. */
export type StoryInterlude = {
 kind:'video';ariaLabel?:string;credit?:string;playLabel?:string;title:string;src:string;poster:string;captions:string;description:string;source:string;sourceLabel:string;
} | {kind:'crawl';fullTextLabel?:string;title:string;kicker:string;paragraphs:string[];seconds:number};
const root=import.meta.env.BASE_URL+'stories/shared/birmingham-letter/';
export const STORY_INTERLUDES:Record<string,StoryInterlude>={
 courage_context_v1:{kind:'crawl',fullTextLabel:'Show full text',title:'Courage Without Applause',kicker:'Near Athens · fourth century BCE',seconds:29,paragraphs:[
 'Near Athens, Aristotle asks how people become good. Repeated choices shape our character; knowing a fine definition is only a beginning. Courage must answer the danger before us, not simply the crowd watching us.',
 'After a storm, a worker waits across a damaged crossing. His son wants to help—and to repair his reputation. You have six decisions before the span gives way. Safety, trust and honour will not always pull in the same direction.'
 ]},
 courage_opening_v1:{kind:'video',title:'What kind of person are you practising becoming?',src:import.meta.env.BASE_URL+'stories/shared/aristotle-courage/opening-v1.mp4',poster:import.meta.env.BASE_URL+'stories/shared/aristotle-courage/opening-v1.poster.jpg',captions:import.meta.env.BASE_URL+'stories/shared/aristotle-courage/opening-v1.vtt',description:'Aristotle asks a question to carry into the rescue.',source:'https://classics.mit.edu/Aristotle/nicomachaen.2.ii.html',sourceLabel:'Explore Nicomachean Ethics, Book II',credit:'',playLabel:'Play opening with sound'},
 birmingham_opening_v1:{kind:'video',ariaLabel:'King’s archival quotation with illustrated reconstruction',title:'The People Who Told Him to Wait',src:root+'opening-v2.mp4',poster:root+'opening-v2.poster.jpg',captions:root+'opening-v2.vtt',description:'“Justice too long delayed is justice denied.” King’s own later reading, over an AI-generated reconstruction of him writing in jail. This is not footage or audio recorded in the cell.',source:'https://okra.stanford.edu/media/audio/630416001.mp3#t=767.9,773.35',sourceLabel:'Original recording · Stanford King Institute'},
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
