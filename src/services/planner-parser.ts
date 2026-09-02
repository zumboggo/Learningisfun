export interface PlannerDaySource { date:string; iso:string; daytype:string; I:string; W:string; Y:string; C:string; due:string[] }
export interface PlannerBlockSource { code:string; title:string; label:string; unit:string; std:string; goal:string; diff:string; days:PlannerDaySource[]; presentationCandidates:string[]; textQueue:string[] }
export interface PlannerWeekSource { key:string; header:string; startDate:string; calendar:string; blocks:PlannerBlockSource[] }
export interface ParsedPlannerSource { weeks:PlannerWeekSource[]; warnings:string[] }

const LABELS:Record<string,string>={'WL-B':'World Literature · Blue','WL-R':'World Literature · Red',AP:'AP English Language',ETH:'Ethics & Leadership'};
const PRES_KEY:Record<string,string>={'WL-B':'WL','WL-R':'WL',AP:'AP',ETH:'ETH'};
const month:Record<string,number>={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
const isoDate=(label:string,year:number)=>{const match=label.match(/\b(\d{1,2})\s+([A-Z][a-z]{2})\b/);if(!match||month[match[2]]===undefined)return '';return `${year}-${String(month[match[2]]+1).padStart(2,'0')}-${match[1].padStart(2,'0')}`};
const unitNumber=(value:string)=>value.match(/Unit\s+[\d.]+/i)?.[0]||'';

export function parsePlannerSource(source:string):ParsedPlannerSource {
  const lines=source.replace(/\r/g,'').split('\n'),warnings:string[]=[];
  const presentations=parsePresentations(lines),queues=parseQueues(lines);
  const starts=lines.map((line,index)=>line.startsWith('[WEEK]')?index:-1).filter(index=>index>=0),weeks:PlannerWeekSource[]=[];
  for(let position=0;position<starts.length;position++){
    const start=starts[position],end=starts[position+1]??lines.length,segment=lines.slice(start,end),header=segment[0].slice(6).trim();
    const startMatch=header.match(/Monday\s+(\d{2})\s+([A-Z][a-z]{2})\s+(\d{4})/),year=Number(startMatch?.[3]||new Date().getFullYear());
    const key=header.split(/\s{2,}/)[0].trim(),startDate=startMatch?`${year}-${String(month[startMatch[2]]+1).padStart(2,'0')}-${startMatch[1]}`:'';
    const calendar=segment.slice(0,5).find(line=>line.includes('CALENDAR:'))?.split('CALENDAR:')[1]?.trim()||'';
    const blocks:PlannerBlockSource[]=[];let current:PlannerBlockSource|null=null;let currentDay:PlannerDaySource|null=null;
    for(const line of segment){
      const block=line.match(/^\s*\[BLOCK\]\s+(\S+)\s+(.*)$/);if(block){current={code:block[1],title:block[2].trim(),label:LABELS[block[1]]||block[1],unit:'',std:'',goal:'',diff:'',days:[],presentationCandidates:presentations.get(key)?.get(PRES_KEY[block[1]])||[],textQueue:[]};blocks.push(current);currentDay=null;continue;}
      if(!current)continue;
      for(const [prefix,field] of [['UNIT','unit'],['STD','std'],['GOAL','goal'],['DIFF','diff']] as const){const match=line.match(new RegExp(`^\\s*${prefix}\\s+(.*)$`));if(match)current[field]=match[1].trim();}
      const day=line.match(/^\s*\[DAY\]\s+(.*)$/);if(day){currentDay={date:day[1].trim(),iso:isoDate(day[1],year),daytype:'',I:'',W:'',Y:'',C:'',due:[]};current.days.push(currentDay);continue;}
      const activity=line.match(/^\s*([IWYC]):\s+(.*)$/);if(activity&&currentDay){let text=activity[2].trim();if(text.includes('‣ DUE:')){const parts=text.split('‣ DUE:');text=parts[0].trim();currentDay.due=parts[1].split('•').map(value=>value.trim()).filter(Boolean);}currentDay[activity[1] as 'I'|'W'|'Y'|'C']=text;if(activity[1]==='I')currentDay.daytype=text.includes('·')?text.split('·')[0].trim():'';}
    }
    for(const block of blocks)block.textQueue=queues.get(PRES_KEY[block.code])?.get(unitNumber(block.unit))||[];
    if(blocks.length)weeks.push({key,header,startDate,calendar,blocks});
  }
  if(weeks.length===0)warnings.push('No [WEEK] sections were found.');
  return {weeks,warnings};
}

function parsePresentations(lines:string[]):Map<string,Map<string,string[]>>{
  const result=new Map<string,Map<string,string[]>>(),start=lines.findIndex(line=>line.startsWith('§7')),end=lines.findIndex((line,index)=>index>start&&line.startsWith('§8'));if(start<0)return result;
  let week='';for(const line of lines.slice(start,end<0?lines.length:end)){const heading=line.trim().match(/^\[([^\]]+)\]$/);if(heading){week=heading[1];result.set(week,new Map());continue;}const row=line.match(/^\s+(WL|AP|ETH)\s{2,}(.*)$/);if(row&&week){const map=result.get(week)!;map.set(row[1],[...(map.get(row[1])||[]),row[2].trim()]);}}
  return result;
}
function parseQueues(lines:string[]):Map<string,Map<string,string[]>>{
  const result=new Map<string,Map<string,string[]>>(),start=lines.findIndex(line=>line.startsWith('§6')),end=lines.findIndex((line,index)=>index>start&&line.startsWith('§7'));if(start<0)return result;
  let course='',unit='';for(const line of lines.slice(start,end<0?lines.length:end)){const courseMatch=line.match(/^\s*---\s+(WL|AP|ETH)\s+---/);if(courseMatch){course=courseMatch[1];result.set(course,new Map());continue;}const unitMatch=line.match(/^\s*(Unit\s+[\d.]+)\s*:/);if(unitMatch&&course){unit=unitMatch[1];result.get(course)!.set(unit,[]);continue;}const item=line.match(/^\s*·\s+(.*)$/);if(item&&course&&unit)result.get(course)!.get(unit)!.push(item[1].trim());}
  return result;
}

export function plannerDiff(previous:ParsedPlannerSource|null,next:ParsedPlannerSource){const old=new Map(previous?.weeks.map(week=>[week.key,JSON.stringify(week)])||[]);return next.weeks.filter(week=>old.get(week.key)!==JSON.stringify(week)).map(week=>week.key);}
