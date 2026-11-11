export interface Encounter {characters:boolean;pinyin:boolean;gloss:boolean;audio:boolean}
export interface Encounters {count:number;items:Encounter[];readingSeconds:number;rate:number}
export const encounterDefaults=():Encounters=>({count:3,items:[{characters:true,pinyin:true,gloss:true,audio:true},{characters:true,pinyin:false,gloss:false,audio:true},{characters:false,pinyin:false,gloss:false,audio:true}],readingSeconds:5,rate:1});
export function readEncounters():Encounters {
 try {const v=JSON.parse(localStorage.getItem('lif-chinese-encounters-v1')||'null');if(v&&[1,2,3].includes(v.count)&&v.items?.length===3&&v.items.every((e:Encounter)=>['characters','pinyin','gloss','audio'].every(k=>typeof e[k as keyof Encounter]==='boolean'))&&[3,5,10,15,20,30].includes(v.readingSeconds)&&[.75,1,1.25].includes(v.rate))return v;}catch{/* Optional storage. */}
 return encounterDefaults();
}
