import {useState} from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {PeerRubricEditor} from '@/components/teachers/PeerRubricEditor';
import type {PeerRubric} from '@/types';
afterEach(cleanup);
it('creates and resizes a custom rubric while preserving edited points',()=>{
 function Harness(){const [rubric,setRubric]=useState<PeerRubric>();return <PeerRubricEditor value={rubric} onChange={setRubric} activities={[]}/>}
 render(<Harness/>);
 fireEvent.change(screen.getByLabelText('Rubric'),{target:{value:'custom'}});
 fireEvent.change(screen.getByLabelText('Criterion 1, Excellent points'),{target:{value:'12'}});
 fireEvent.change(screen.getByLabelText('Rows'),{target:{value:'2'}});
 fireEvent.change(screen.getByLabelText('Columns'),{target:{value:'4'}});
 expect(screen.getByLabelText('Criterion 1, Excellent points')).toHaveValue(12);
 expect(screen.getByLabelText('Row 2 name')).toHaveValue('Criterion 2');
 expect(screen.getByLabelText('Column 4 name')).toHaveValue('Level 4');
 expect(screen.getByText('Total: 15 points')).toBeInTheDocument();
});
