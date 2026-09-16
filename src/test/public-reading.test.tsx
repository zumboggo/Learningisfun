import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PublicReadingChoice, TextPublicSharing } from '@/components/texts/TextPublicSharing';
import { TextPresentPage } from '@/pages/teacher/TextPresentPage';
import { TextReaderPage } from '@/pages/TextReaderPage';
const api=vi.hoisted(()=>vi.fn());
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:api}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('the teacher Present route uses the exact student reader component',()=>expect(TextPresentPage).toBe(TextReaderPage));
it('offers a visible on/off choice before posting',()=>{
  const onChange=vi.fn();render(<PublicReadingChoice enabled onChange={onChange}/>);const box=screen.getByRole('checkbox',{name:'Anyone with the link can read'});expect(box).toBeChecked();fireEvent.click(box);expect(onChange).toHaveBeenCalledWith(false);
});
it('fetches saved access instead of assuming existing texts are public, and allows revocation',async()=>{
  api.mockResolvedValueOnce({enabled:true}).mockResolvedValueOnce({enabled:false});
  render(<TextPublicSharing textId="text"/>);expect(api).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Link access'}));
  await screen.findByText('Public reading enabled');fireEvent.click(screen.getByRole('checkbox'));await screen.findByText('Class access required');
  expect(api).toHaveBeenLastCalledWith({action:'setTextPublicSharing',textId:'text',enabled:false});
});
