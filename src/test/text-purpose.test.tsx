import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {useState} from 'react';
import {TextPurposeControls,TextPurposeLabels,type TextPurpose} from '@/components/texts/TextPurpose';
afterEach(cleanup);
it('toggles copywork and assigned reading independently and explains the letters',()=>{
  function Form(){const [value,setValue]=useState<TextPurpose>({isCopywork:false,isAssignedReading:false});return <><TextPurposeControls value={value} onChange={setValue}/><TextPurposeLabels value={value}/></>;}
  render(<Form/>);
  const c=screen.getByRole('button',{name:'Copywork'}),a=screen.getByRole('button',{name:'Assigned Reading'});
  expect(c).toHaveAttribute('title','Copywork');expect(a).toHaveAttribute('title','Assigned Reading');
  expect(screen.getByText('Optional reading')).toBeInTheDocument();
  fireEvent.click(c);fireEvent.click(a);
  expect(c).toHaveAttribute('aria-pressed','true');expect(a).toHaveAttribute('aria-pressed','true');
  expect(screen.getByText('Copywork')).toBeInTheDocument();expect(screen.getByText('Assigned reading')).toBeInTheDocument();
  fireEvent.click(c);expect(c).toHaveAttribute('aria-pressed','false');expect(a).toHaveAttribute('aria-pressed','true');
  fireEvent.click(a);expect(screen.getByText('Optional reading')).toBeInTheDocument();
});
it('does not relabel older unclassified readings as optional',()=>{render(<TextPurposeLabels value={{}}/>);expect(screen.getByText('Reading')).toBeInTheDocument();});
