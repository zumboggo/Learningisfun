import {expect,it} from 'vitest';
import {formatWritingExport} from '@/services/writing-export';
const data={prompt:'Explain "中文", please',className:'Literature',date:'2026-10-15',posts:[{id:'a',parentId:null,label:'Response A',content:'Line one\nLine two, "quoted"',createdAt:'2026-10-15',name:'Alice'},{id:'b',parentId:'a',label:'Reader B',content:'=HYPERLINK("example")',createdAt:'2026-10-15',name:'Bob'}]};
it('exports UTF-8 multiline CSV safely and includes names only on request',()=>{
 const csv=formatWritingExport(data,'csv',false);expect(csv).toContain('"Explain ""中文"", please"');expect(csv).toContain('Line one\nLine two, ""quoted""');expect(csv).toContain('"\'=HYPERLINK');expect(csv).not.toContain('Alice');expect(formatWritingExport(data,'csv',true)).toContain('Alice');
});
it('TXT retains parent IDs and paragraph breaks',()=>{const txt=formatWritingExport(data,'txt',false);expect(txt).toContain('Reply to: a');expect(txt).toContain('Line one\nLine two');expect(txt).not.toContain('Alice');});
