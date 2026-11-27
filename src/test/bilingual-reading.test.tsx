import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {BilingualReading} from '@/components/texts/BilingualReading';
const api=vi.hoisted(()=>({getTranslation:vi.fn(),reportTranslation:vi.fn()}));
vi.mock('@/services/text-translation.service',async original=>({...await original<typeof import('@/services/text-translation.service')>(),...api}));
const props={userId:'reader',textId:'t',level:'original',paragraphs:[{$id:'p',textId:'t',sortOrder:0,content:'Hello. World.'}],contents:['Hello. World.'],ready:true,available:true,compare:false,fontSize:22,article:true};
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();api.getTranslation.mockResolvedValue([{english:'Hello. ',translation:'你好。'},{english:'World.',translation:'世界。'}]);});
afterEach(cleanup);
it.each(['original','supported','highly_supported'])('supports both modes with %s English and remembers choice',async level=>{
 render(<BilingualReading {...props} level={level}/>);
 expect(screen.getByRole('button',{name:'Off'})).toHaveAttribute('aria-pressed','true');
 fireEvent.change(screen.getByLabelText('Your language'),{target:{value:'zh-Hans'}});
 await screen.findByText('你好。 世界。');expect(screen.getByRole('button',{name:'Paragraph Mode'})).toHaveAttribute('aria-pressed','true');
 fireEvent.click(screen.getByRole('button',{name:'Sentence Mode'}));await screen.findByText('你好。');expect(api.getTranslation).toHaveBeenCalledTimes(1);
 expect(api.getTranslation.mock.calls[0][0].level).toBe(level);
 expect(JSON.parse(localStorage.getItem('bilingual:reader')!).mode).toBe('sentence');
 fireEvent.click(screen.getByRole('button',{name:'Off'}));expect(screen.queryByText('你好。')).not.toBeInTheDocument();expect(screen.getByText('Hello. World.')).toBeInTheDocument();
});
it('ignores late language responses and renders RTL',async()=>{
 let resolve!:(value:unknown)=>void;api.getTranslation.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
 render(<BilingualReading {...props}/>);fireEvent.change(screen.getByLabelText('Your language'),{target:{value:'zh-Hans'}});
 await waitFor(()=>expect(api.getTranslation).toHaveBeenCalledTimes(1));
 api.getTranslation.mockResolvedValue([{english:'Hello. World.',translation:'مرحبا'}]);fireEvent.change(screen.getByLabelText('Your language'),{target:{value:'ar'}});
 expect(await screen.findByText('مرحبا')).toBeInTheDocument();resolve([{english:'Hello. World.',translation:'旧'}]);
 await waitFor(()=>expect(screen.queryByText('旧')).not.toBeInTheDocument());expect(screen.getByText('مرحبا').closest('[lang]')).toHaveAttribute('dir','rtl');
});
it('keeps English visible on failure and supports retry',async()=>{
 api.getTranslation.mockRejectedValueOnce(Error('Offline'));
 render(<BilingualReading {...props}/>);fireEvent.change(screen.getByLabelText('Your language'),{target:{value:'zh-Hans'}});
 await screen.findByRole('alert');expect(screen.getByText('Hello. World.')).toBeInTheDocument();fireEvent.click(screen.getByText('Retry translation'));await screen.findByText('你好。 世界。');
});
it('does not generate for PDFs, links, or unready English',()=>{
 const {rerender}=render(<BilingualReading {...props} article={false}/>);fireEvent.change(screen.getByLabelText('Your language'),{target:{value:'zh-Hans'}});
 rerender(<BilingualReading {...props} available={false}/>);rerender(<BilingualReading {...props} ready={false}/>);expect(api.getTranslation).not.toHaveBeenCalled();
});
