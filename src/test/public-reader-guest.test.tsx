import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TextPublicReaderPage } from '@/pages/TextReaderPage';
const request=vi.hoisted(()=>vi.fn());
vi.mock('@/services/public-reading.service',()=>({publicReadingRequest:request}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:null,isTeacher:false,isParent:false})}));
vi.mock('dexie-react-hooks',()=>({useLiveQuery:()=>undefined}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
const mount=()=>render(<MemoryRouter initialEntries={['/texts/text']}><Routes><Route path="/texts/:textId" element={<TextPublicReaderPage/>}/></Routes></MemoryRouter>);
it('a signed-out visitor reads public text using the shared reader without class tools',async()=>{
  request.mockResolvedValue({text:{$id:'text',title:'Shared article',author:'Writer',status:'published'},paragraphs:[{$id:'p',textId:'text',sortOrder:0,content:'**Readable** without login.'}]});mount();
  await screen.findByRole('heading',{name:'Shared article'});expect(screen.getByText('Readable')).toBeInTheDocument();
  expect(screen.queryByRole('link',{name:/Discuss/})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Link access'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Larger text'}));expect(screen.getByRole('main',{name:'Reading text'})).toHaveStyle({fontSize:'24px'});
  expect(request).toHaveBeenCalledWith('text');
});
it('class-only links explain the sign-in requirement without returning private content',async()=>{
  request.mockRejectedValue(Error('This text is not publicly shared.'));mount();await screen.findByRole('alert');expect(screen.getByRole('link',{name:'Sign in to your class'})).toHaveAttribute('href','/login');expect(screen.queryByRole('main',{name:'Reading text'})).not.toBeInTheDocument();
});
