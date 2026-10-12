import {expect,it} from 'vitest';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
// @ts-expect-error Authoring scripts run in Node, not shipped to the browser.
import {validateEpisode,validateAssignments} from '../../scripts/episode-schema.mjs';
// @ts-expect-error Node-only scaffold utility.
import {newEpisode} from '../../scripts/new-episode.mjs';
const story=JSON.parse(readFileSync('stories/question-journal/a-knight-needs-a-witness-v2.episode.json','utf8'));
it('rejects incomplete drafts, ungrounded scoring, missing evidence, and invalid return checks',()=>{expect(()=>validateEpisode(story)).not.toThrow();for(const alter of [(s:any)=>s.draft=true,(s:any)=>s.scenes[0].choices[0].points[0]=25,(s:any)=>s.scenes[1].source='missing',(s:any)=>s.driverQuestions.pop(),(s:any)=>s.presentation.assetBase='../other/']){const s=structuredClone(story);alter(s);expect(()=>validateEpisode(s)).toThrow();}});
it('scaffolds an unassigned draft from a verified unit without overwriting files',()=>{const temp=mkdtempSync(join(tmpdir(),'episode-template-test-'));try{const output=join(temp,'new.json');newEpisode({id:'a-new-question',unitId:story.unitId,title:'A new question',output});const s=JSON.parse(readFileSync(output,'utf8'));expect(s.presentation.assetBase).toBe(story.presentation.assetBase);expect(s.driverQuestions).toHaveLength(4);expect(()=>validateEpisode(s)).toThrow(/scaffold/);expect(()=>newEpisode({id:'a-new-question',unitId:story.unitId,title:'Again',output})).toThrow();}finally{rmSync(temp,{recursive:true,force:true});}});
it('rejects duplicate assignments and unverified sections',()=>{const units=JSON.parse(readFileSync('stories/episode-units.json','utf8')),all=JSON.parse(readFileSync('stories/episode-assignments.json','utf8')),a=all.filter((a:any)=>a.version===2&&a.episodeId===story.id);expect(()=>validateAssignments(a,[story],units)).not.toThrow();expect(()=>validateAssignments([...a,a[0]],[story],units)).toThrow(/Duplicate/);expect(()=>validateAssignments([{...a[0],classId:'canvas-21695'}],[story],units)).toThrow(/verified/);});
