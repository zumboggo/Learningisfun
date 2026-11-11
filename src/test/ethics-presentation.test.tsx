import {describe,it,expect,vi,beforeEach} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {EthicsPresentationBuilder} from '@/components/ethics/EthicsPresentationBuilder';
import {emptyDraft,updateChoice,choiceComplete,buildPresentationPrompt} from '@/services/ethics-presentation';
import {downloadBlob} from '@/services/qti-export';
import {executeLearningContent} from '@/services/learning-content.service';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
vi.mock('@/services/qti-export',()=>({downloadBlob:vi.fn()}));
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();});
describe('Ethics presentation builder',()=>{
 it('requires personal reasoning for assisted choices and flags downstream answers',()=>{
  let draft=emptyDraft();draft=updateChoice(draft,0,'When should friends say no?');draft=updateChoice(draft,1,'Set a respectful boundary',true);
  expect(choiceComplete(draft.choices[1])).toBe(false);draft.choices[1].reason='It protects both people';expect(choiceComplete(draft.choices[1])).toBe(true);
  draft=updateChoice(draft,2,'A fictional friend asks to copy homework');draft=updateChoice(draft,0,'How should leaders admit mistakes?');
  expect(draft.choices[1].stale).toBe(true);expect(draft.choices[2].text).toContain('homework');expect(choiceComplete(draft.choices[2])).toBe(false);
 });
 it('preserves the assessment boundaries and exact placeholder',()=>{
  const prompt=buildPresentationPrompt(emptyDraft());
  for(const text of ['Class Connection','Students fill in how this connects to the class here','speaker notes completely empty','CURRENT UNIT','EXACTLY THREE','ONE minute of buffer','Do NOT write my individual reflection','NO automatic penalty','November 13, 2026 at 11:59 p.m. China time'])expect(prompt).toContain(text);
 });
 it('waits for selection and a student reason, then generates an editable prompt',async()=>{
  vi.mocked(executeLearningContent).mockResolvedValue({options:[{text:'Consider affected people',why:'Reveals competing interests'},{text:'Test consistency',why:'Checks fairness'},{text:'Set a boundary',why:'Protects care'}]});
  render(<EthicsPresentationBuilder classId="ethics" userId="student"/>);
  fireEvent.click(screen.getByText('Build my presentation prompt'));
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'When should I say no to a friend?'}});fireEvent.click(screen.getByText('Continue'));
  fireEvent.click(screen.getByText('Suggest three ideas'));
  await screen.findByText('Consider affected people');expect(screen.getByRole('textbox')).toHaveValue('');
  fireEvent.click(screen.getByText('Consider affected people'));
  expect(screen.getByText('Continue')).toBeDisabled();
  fireEvent.change(screen.getByLabelText('This could help because…'),{target:{value:'Both friends have needs'}});
  fireEvent.click(screen.getByText('Continue'));
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'A fictional friend asks to copy my work'}});fireEvent.click(screen.getByText('Continue'));
  fireEvent.click(screen.getByText('Rewrite: improve an unfair, unhelpful, or misleading response'));fireEvent.click(screen.getByText('Continue'));
  fireEvent.click(screen.getByText('Funny'));fireEvent.click(screen.getByText('Warm'));fireEvent.click(screen.getByText('Generate my prompt'));
  expect((screen.getByLabelText('Editable presentation prompt') as HTMLTextAreaElement).value).toContain('Both friends have needs');
  expect((screen.getByLabelText('Editable presentation prompt') as HTMLTextAreaElement).value).toContain('Voice: Funny, Warm');
  expect(screen.getByText('Download .txt')).toBeEnabled();
  fireEvent.change(screen.getByLabelText('Editable presentation prompt'),{target:{value:'My edited prompt'}});
  const writeText=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText}});
  fireEvent.click(screen.getByText('Copy prompt'));await waitFor(()=>expect(writeText).toHaveBeenCalledWith('My edited prompt'));
  fireEvent.click(screen.getByText('Download .txt'));expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob),'ethics-presentation-prompt.txt');
  expect(await vi.mocked(downloadBlob).mock.calls[0][0].text()).toBe('My edited prompt');
 });
 it('allows manual work after suggestions fail',async()=>{
  vi.mocked(executeLearningContent).mockRejectedValue(new Error('AI is unavailable'));
  render(<EthicsPresentationBuilder classId="ethics" userId="student"/>);fireEvent.click(screen.getByText('Build my presentation prompt'));
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'What is fair?'}});fireEvent.click(screen.getByText('Continue'));fireEvent.click(screen.getByText('Suggest three ideas'));
  await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('You can still write your own answer'));
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'Compare needs'}});expect(screen.getByText('Continue')).toBeEnabled();
 });
});
