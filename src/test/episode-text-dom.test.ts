import {afterEach,expect,it,vi} from 'vitest';
import {connectEpisodeText,type TextField,type TextPatches} from '@/services/episode-text-dom';
afterEach(()=>{document.body.innerHTML='';});
it('replaces plain text without replacing links, handlers or formatting and restores the original',()=>{
 document.body.innerHTML='<div class="passage" aria-live="polite" data-passage="Village"><p>Old <strong>bold</strong> ending.</p><button>Choose grain</button><script>secret code</script><textarea>Student writing</textarea><p class="score">80/100</p></div><tw-storydata><tw-passagedata>Secret source code</tw-passagedata></tw-storydata>';
 let fields:TextField[]=[];let patches:TextPatches={};const action=vi.fn();document.querySelector('button')!.onclick=action;
 const controller=connectEpisodeText(document,()=>patches,f=>fields=f);
 expect(fields.map(f=>f.text)).toEqual(['Old ','bold',' ending.','Choose grain']);
 const field=fields[0];patches={[field.key]:{original:field.original,text:'<img src=x onerror=alert(1)>'}};controller.refresh();
 expect(document.querySelector('img')).toBeNull();expect(document.querySelector('p')!.textContent).toContain('<img src=x');
 expect(document.querySelector('strong')!.textContent).toBe('bold');document.querySelector('button')!.click();expect(action).toHaveBeenCalledOnce();
 patches={};controller.refresh();expect(document.querySelector('p')!.textContent).toBe('Old bold ending.');controller.disconnect();
});
it('uses distinct stable keys per passage and reapplies edits after a passage rerender',()=>{
 let fields:TextField[]=[];let patches:TextPatches={};document.body.innerHTML='<div class="passage" data-passage="One"><p>Continue</p></div>';
 const controller=connectEpisodeText(document,()=>patches,f=>fields=f);const key=fields[0].key;patches={[key]:{original:'Continue',text:'Go on'}};
 document.body.innerHTML='<div class="passage" data-passage="Two"><p>Continue</p></div>';controller.refresh();expect(fields[0].key).not.toBe(key);expect(fields[0].text).toBe('Continue');
 document.body.innerHTML='<div class="passage" data-passage="One"><p>Continue</p></div>';controller.refresh();expect(fields[0].key).toBe(key);expect(fields[0].text).toBe('Go on');controller.disconnect();
});
it('discovers passages when SugarCube removes its loading-screen attribute',async()=>{
 document.documentElement.setAttribute('data-init','loading');document.body.innerHTML='<style>html[data-init] .passage { display:none; }</style><div class="passage" aria-live="polite"><p>Ready to edit</p></div>';
 let fields:TextField[]=[];const controller=connectEpisodeText(document,()=>({}),f=>fields=f);expect(fields).toHaveLength(0);
 document.documentElement.removeAttribute('data-init');await vi.waitFor(()=>expect(fields.map(f=>f.text)).toEqual(['Ready to edit']));controller.disconnect();
});
