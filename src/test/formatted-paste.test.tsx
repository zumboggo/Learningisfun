import {useState} from 'react';
import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MarkdownPasteEditor} from '@/components/common/MarkdownPasteEditor';
import {Markdown} from '@/components/common/Markdown';
afterEach(cleanup);
it('replaces the selection with styled clipboard content and previews paragraphs and combined emphasis',()=>{
 function Editor(){const [value,setValue]=useState('Replace me');return <MarkdownPasteEditor value={value} onChange={setValue}/>}
 const {container}=render(<Editor/>);const input=screen.getByRole('textbox') as HTMLTextAreaElement;input.setSelectionRange(0,input.value.length);
 fireEvent.paste(input,{clipboardData:{getData:(type:string)=>type==='text/html'?'<p><span style="font-weight:700">Claim</span> with <span style="font-style:italic">evidence</span>.</p><p><span style="font-weight:700;font-style:italic">Both</span><br>New line</p>':''}});
 expect(input.value).toBe('**Claim** with *evidence*.\n\n***Both***\nNew line');
 expect(container.querySelector('strong')).toHaveTextContent('Claim');expect(container.querySelector('strong em')).toHaveTextContent('Both');expect(screen.getByText('evidence').tagName).toBe('EM');expect(screen.getByText(/New line/,{selector:'p'}).textContent).toBe('Both\nNew line');
});
it('renders combined and nested emphasis safely',()=>{
 const {container}=render(<Markdown content={'***Both*** and **bold with *italic* inside**\n\n<script>alert(1)</script>'}/>);
 expect(container.querySelector('strong em')).toHaveTextContent('Both');expect(container.querySelectorAll('strong')[1].querySelector('em')).toHaveTextContent('italic');expect(container.querySelector('script')).toBeNull();
});
