export type TaxiClip = 'arrival' | 'departure';

const mediaRoot = import.meta.env.BASE_URL + 'stories/shared/magical-taxi/';
export const TAXI_CLIPS = {
 arrival: {title: 'The magical taxi arrives', src: mediaRoot + 'arrival-v1.mp4', poster: mediaRoot + 'arrival-v1.jpg', captions: mediaRoot + 'arrival-v1.vtt', description: 'A vortex opens in the classroom wall. The taxi parks, and the driver steps out in sunglasses. Mr. Hepting asks, “Ready to go?” The driver replies, “Let’s go!”'},
 departure: {title: 'Through the vortex', src: mediaRoot + 'departure-v1.mp4', poster: mediaRoot + 'departure-v1.jpg', captions: mediaRoot + 'departure-v1.vtt', description: 'The taxi flies from the fourth floor beside the school’s red stripe, banks over the soccer field, revs up, and shoots into a vortex. The car and vortex vanish, leaving the school quiet.'},
} satisfies Record<TaxiClip, {title:string;src:string;poster:string;captions:string;description:string}>;

// Display compatibility for released packages; never rewrite their scripts or saved steps.
export const taxiWording = (text:string) => text.replace(/\bmagical\s+didi\b/gi, 'magical taxi').replace(/\bdidi\b/gi, 'taxi');

interface TaxiStory {nodes:{type:string;text?:string;id?:string}[];labels:Record<string,number>}
export function taxiCutsceneCursors(story:TaxiStory|undefined):Partial<Record<number,TaxiClip>> {
 if(!story)return {};
 const result:Partial<Record<number,TaxiClip>> = {};
 const labelled = (label:string) => {
  const start=story.labels[label];
  if(start===undefined)return -1;
  const relative=story.nodes.slice(start+1).findIndex(n=>['say','choice','act','end'].includes(n.type));
  const cursor=relative<0?-1:start+1+relative;
  return story.nodes[cursor]?.type==='say'?cursor:-1;
 };
 let arrival=labelled('taxi_arrival');
 if(arrival<0)arrival=story.nodes.findIndex(n=>n.type==='say'&&/\b(?:didi|(?:magical\s+)?taxi|rideshare)\b/i.test(n.text||'')&&/classroom|window|wall/i.test(n.text||'')&&!/returns?|home again/i.test(n.text||''));
 let departure=labelled('taxi_departure');
 if(departure<0&&arrival>=0)departure=story.nodes.findIndex((n,i)=>i>arrival&&n.type==='say'&&/soccer field|goalposts/i.test(n.text||'')&&!/returns?|ride home|waiting|waits outside/i.test(n.text||''));
 if(arrival>=0)result[arrival]='arrival';
 if(departure>=0&&departure!==arrival)result[departure]='departure';
 return result;
}
