import {it,expect,vi} from 'vitest';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
import {executeLearningContent} from '@/services/learning-content.service';
import {cachedPlanningMaterials} from '@/services/planning-material-cache';
it('coalesces focus refreshes and isolates accounts and class scopes',async()=>{
 const request=vi.mocked(executeLearningContent);request.mockResolvedValue({copywork:[]});
 await Promise.all([cachedPlanningMaterials('a','c'),cachedPlanningMaterials('a','c')]);
 await cachedPlanningMaterials('a','c');expect(request).toHaveBeenCalledTimes(1);
 await cachedPlanningMaterials('b','c');await cachedPlanningMaterials('a','d');
 expect(request).toHaveBeenCalledTimes(3);
});
it('does not cache a failed request as a successful empty result',async()=>{
 const request=vi.mocked(executeLearningContent);request.mockRejectedValueOnce(new Error('offline'));
 await expect(cachedPlanningMaterials('retry','c')).rejects.toThrow('offline');
 request.mockResolvedValueOnce({copywork:[{id:'new'}]});
 expect(await cachedPlanningMaterials('retry','c')).toEqual({copywork:[{id:'new'}]});
});
