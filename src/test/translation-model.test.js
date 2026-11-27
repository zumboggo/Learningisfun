import {afterEach,expect,it,vi} from 'vitest';
const billing=vi.hoisted(()=>({resolveBilling:vi.fn(async()=>({token:'test',source:'shared'})),reserveUsage:vi.fn(),settleUsage:vi.fn(),monthKey:vi.fn(),connectionStatus:vi.fn()}));
vi.mock('../../functions/learning-content/src/ai-billing.js',()=>billing);
import {paidCompletion,maximumCost} from '../../functions/learning-content/src/teacher-ai.js';
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();});
it.each([['translation','google/gemini-3.1-flash-lite',.25,1.5],['general','openai/gpt-4o-mini',.15,.6]])('routes %s with matching price caps and reservations',async(purpose,model,input,output)=>{
 const fetch=vi.fn(async()=>({ok:true,json:async()=>({id:'generation',choices:[{message:{content:'{}'}}],usage:{cost:.001}})}));vi.stubGlobal('fetch',fetch);
 const messages=[{role:'user',content:'Translate this.'}];await paidCompletion({},{ownerId:'teacher',messages,json:true,purpose});
 const request=JSON.parse(fetch.mock.calls[0][1].body);expect(request.model).toBe(model);expect(request.provider.max_price).toEqual({prompt:input,completion:output});expect(request.provider.allow_fallbacks).toBe(false);
 expect(billing.reserveUsage.mock.calls[0][1].reservation).toBe(maximumCost(messages,purpose));expect(billing.reserveUsage.mock.calls[0][1].details.model).toBe(model);
 expect(maximumCost(messages,purpose)).toBeGreaterThanOrEqual((Buffer.byteLength(JSON.stringify(messages))+2048)*input/1e6+8192*output/1e6);
 if(purpose==='translation'){expect(request.reasoning.effort).toBe('minimal');expect(request.provider.only).toContain('google-ai-studio');}else expect(request.reasoning).toBeUndefined();
});
it('rejects arbitrary model profiles',()=>{expect(()=>maximumCost([],'expensive')).toThrow('Unsupported');});
