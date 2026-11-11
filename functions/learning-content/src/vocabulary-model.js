export function monday(value){const d=new Date(value+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(+d)||d.toISOString().slice(0,10)!==value)throw Error('Choose a valid first teaching week.');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
export function batches(value){
 if(!Number.isInteger(value.wordsPerWeek)||value.wordsPerWeek<1||value.wordsPerWeek>100)throw Error('Choose 1–100 words per week.');
 let week=monday(value.firstWeek);const skip=new Set((value.skipWeeks||[]).map(monday)),out=[];let offset=0;
 for(let guard=0;offset<value.cards.length&&guard<600;guard++){
 const d=new Date(week+'T00:00:00Z');
 if(!skip.has(week)){const release=new Date(d);release.setUTCDate(release.getUTCDate()-3);out.push({week,releaseAt:release.toISOString(),cards:value.cards.slice(offset,offset+value.wordsPerWeek)});offset+=value.wordsPerWeek;}
 d.setUTCDate(d.getUTCDate()+7);week=d.toISOString().slice(0,10);
 }
 if(offset<value.cards.length)throw Error('Schedule must fit within 600 weeks.');return out;
}
export function parseVocabularyCsv(content){
 const records=[];let row=[],cell='',quoted=false;const errors=[];
 for(let i=0;i<content.length;i++){const c=content[i];if(c==='"'){if(quoted&&content[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell.trim());cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&content[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))records.push(row);row=[];cell='';}else cell+=c;}
 if(cell||row.length){row.push(cell.trim());records.push(row);}if(quoted)errors.push('Unclosed quoted CSV field.');
 const headers=(records.shift()||[]).map(s=>s.replace(/^\uFEFF/,'').toLowerCase()),term=headers.indexOf('term'),definition=headers.indexOf('definition'),example=headers.indexOf('example');
 if(term<0||definition<0)errors.push('CSV headers must include Term and Definition.');
 const cards=records.map((r,i)=>{if(!r[term]||!r[definition])errors.push(`Row ${i+2}: Term and Definition are required.`);if(r.length!==headers.length)errors.push(`Row ${i+2}: Column count does not match the header.`);if(r.some(s=>s.length>5000)||[r[definition],r[example]].filter(Boolean).join('\n\n').length>5000)errors.push(`Row ${i+2}: Keep each field under 5,000 characters.`);return {id:'row-'+(i+1),front:r[term]||'',back:[r[definition],r[example]].filter(Boolean).join('\n\n')};});
 if(!cards.length)errors.push('Add at least one vocabulary row.');if(cards.length>2000)errors.push('Upload up to 2,000 rows per list.');return {cards,errors};
}
