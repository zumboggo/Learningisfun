/** Media stays outside immutable packages. Each interlude consumes one legal narration beat. */
export type StoryInterlude = {
 kind:'video';ariaLabel?:string;credit?:string;playLabel?:string;title:string;src:string;poster:string;captions:string;description:string;source:string;sourceLabel:string;
} | {kind:'photo';title:string;src:string;alt:string;caption:string;question:string;source:string;credit:string} | {kind:'crawl';fullTextLabel?:string;title:string;kicker:string;paragraphs:string[];seconds:number};
const root=import.meta.env.BASE_URL+'stories/shared/birmingham-letter/';
export const STORY_INTERLUDES:Record<string,StoryInterlude>={
 owned_opening_v1:{kind:'video',title:'Everything I Owned',src:import.meta.env.BASE_URL+'stories/shared/everything-i-owned/opening-v1.mp4',poster:import.meta.env.BASE_URL+'stories/shared/everything-i-owned/opening-v1.poster.jpg',captions:import.meta.env.BASE_URL+'stories/shared/everything-i-owned/opening-v1.vtt',description:'Santiago searches his pouch in an empty Tangier marketplace. Cloth rustles; there are no coins.',source:'',sourceLabel:'',credit:'',playLabel:'Play with sound'},
 joke_opening_v1:{kind:'video',title:'Can I try that again?',src:import.meta.env.BASE_URL+'stories/shared/joke-v1/opening-v1.mp4',poster:import.meta.env.BASE_URL+'stories/shared/joke-v1/opening-v1.poster.jpg',captions:import.meta.env.BASE_URL+'stories/shared/joke-v1/opening-v1.vtt',description:'Kevin risks another try.',source:'',sourceLabel:'',credit:'',playLabel:'Play with sound'},
 birmingham_opening_v2:{kind:'video',ariaLabel:'King’s archival quotation with illustrated reconstruction',title:'The People Who Told Him to Wait',src:root+'opening-v2.mp4',poster:root+'opening-v2.poster.jpg',captions:root+'opening-v2.vtt',description:'“Justice too long delayed is justice denied.” — Martin Luther King Jr., reading his letter.',credit:'',source:'https://okra.stanford.edu/media/audio/630416001.mp3#t=767.9,773.35',sourceLabel:'Hear the original recording · Stanford King Institute'},
 birmingham_context_v2:{kind:'crawl',fullTextLabel:'Show full text',title:'The People Who Told Him to Wait',kicker:'Birmingham, Alabama · April–May 1963',seconds:27,paragraphs:[
 'Segregation restricts Black residents’ lives. Birmingham’s local movement and Martin Luther King Jr.’s organization press for change. Arrested in April, King writes a defense of nonviolent pressure. By May he is free, but the struggle continues.',
 'Young people are joining the demonstrations. Families fear the police; organizers fear another broken promise. You arrive to help carry their questions to King. What advice can you give when the next decision may put someone in danger?'
 ]},
 birmingham_hose_v2:{kind:'photo',title:'Birmingham · May 3, 1963',src:root+'hose-archive.jpg',alt:'Firefighters aim a high-pressure stream across a Birmingham street toward people crouching and bracing near the Parkview Inn.',caption:'Fire hoses used against civil rights demonstrators near the Parkview Inn. The archive dates this photograph to May 3, 1963.',question:'What does the image reveal about the force used? What can it not tell us about the decisions that brought people here?',source:'https://crdl.usg.edu/record/aar_amg_206443',credit:'Birmingham News / Alabama Media Group Collection. © Alabama Department of Archives and History.'},
 birmingham_dog_v2:{kind:'photo',title:'Walter Gadsden · Birmingham, May 1963',src:root+'dog-archive.jpg',alt:'Walter Gadsden recoils from a police dog with its mouth open; an officer holds the leash and a crowd watches behind them.',caption:'The archive identifies the young man as Walter Gadsden and dates the photograph to May 1963. A photograph records an instant; it cannot establish every person’s motive or role.',question:'How should a truthful caption preserve his identity without claiming more than the image and its record establish?',source:'https://crdl.usg.edu/record/aar_amg_14478',credit:'Birmingham News / Alabama Media Group Collection. © Alabama Department of Archives and History.'},
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
export function storyInterludeCursors(story:{nodes:{type:string}[];labels:Record<string,number>}|undefined,mediaUrls:Record<string,string>={}):Record<number,StoryInterlude>{
 const result:Record<number,StoryInterlude>={};if(!story)return result;
 for(const [label,media] of Object.entries(STORY_INTERLUDES)){
  const start=story.labels[label];if(start===undefined)continue;
  const offset=story.nodes.slice(start+1).findIndex(n=>['say','choice','act','end'].includes(n.type));
  if(offset>=0&&story.nodes[start+1+offset].type==='say'){const resolved={...media};for(const field of ['src','poster','captions'] as const)if(field in resolved){const path=(resolved as unknown as Record<string,string>)[field].replace(import.meta.env.BASE_URL,'');if(mediaUrls[path])(resolved as unknown as Record<string,string>)[field]=mediaUrls[path];}result[start+1+offset]=resolved;}
 }
 return result;
}
