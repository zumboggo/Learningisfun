import {expect,it} from 'vitest';
import {parsePlannerSource} from '@/services/planner-parser';
it('keeps weekly text options separate even within the same unit',()=>{
 const parsed=parsePlannerSource(`§6 QUEUES
--- AP ---
Unit 1:
· Old unit suggestion
§7 PRESENTATIONS
§8 WEEKS
[WEEK] Sep 14-18   Monday 14 Sep 2026
[BLOCK] AP English
UNIT Unit 1: Rhetoric
[TEXT] First essay
[TEXT] COPY · Model paragraph
[PRESENT] Audience
[DAY] Tue 15 Sep
W: Optional discussion
[WEEK] Sep 21-25   Monday 21 Sep 2026
[BLOCK] AP English
UNIT Unit 1: Rhetoric
[TEXT] Second essay
[PRESENT] Purpose
[DAY] Tue 22 Sep
W: Optional debate
REFERENCE | [TEXT] Not a resource
`);
 expect(parsed.weeks[0].blocks[0].textQueue).toEqual(['First essay','COPY · Model paragraph']);
 expect(parsed.weeks[1].blocks[0].textQueue).toEqual(['Second essay']);
 expect(parsed.weeks.map(w=>w.blocks[0].presentationCandidates)).toEqual([['Audience'],['Purpose']]);
 expect(parsed.weeks[1].blocks[0].days[0].iso).toBe('2026-09-22');
});
