import { test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import markup from '../features/planning/editor.html?raw';
import editor from '../features/planning/editor.js?raw';
function open(user, saved = {}) {
  const dom = new JSDOM(markup, { url: 'https://example.test/Learningisfun/', runScripts: 'outside-only' });
  const win = dom.window;
  win.PLANNING_USER = user;
  win.confirm = () => true;
  for (const [key,value] of Object.entries(saved)) win.localStorage.setItem(key,value);
  win.eval(editor);
  return { dom, win, run: (code) => win.eval(code) };
}
// Evaluate in the same script because the editor deliberately keeps its state lexical.
function evaluate(user, assertions, saved = {}) {
  const dom = new JSDOM(markup, { url: 'https://example.test/Learningisfun/', runScripts: 'outside-only' });
  dom.window.PLANNING_USER = user;
  dom.window.confirm = () => true;
  for (const [key,value] of Object.entries(saved)) dom.window.localStorage.setItem(key,value);
  dom.window.eval(editor + '\n' + assertions);
  return dom;
}
test('mounts 80 editable cells with the fixed planning template', () => {
  const { dom, win } = open('alice');
  expect(win.document.querySelectorAll('.card')).toHaveLength(80);
  expect(win.document.querySelectorAll('.row-label textarea')).toHaveLength(8);
  expect(win.document.querySelector('#todo-list')).toBeTruthy();
  dom.window.close();
});
test('accounts get separate local boards; existing exports can be imported', () => {
  const data = { title: 'Alice private', rows: Array(5).fill('Topic'), cards: Array(40).fill('Secret') };
  const saved = { 'learning-planning:alice': JSON.stringify({ currentId: 'old', boards: [{ id: 'old', data }] }) };
  const alice = open('alice', saved); const bob = open('bob', saved);
  expect(alice.win.document.querySelector('.preview')?.textContent).toBe('Secret');
  expect(bob.win.document.querySelector('.preview')).toBeNull();
  alice.dom.window.close(); bob.dom.window.close();
});
test('row/card moves preserve full text and CSV handles quoted newlines', () => {
  const dom = evaluate('alice', `
    state.cards[0]='One two three four five six seven eight nine ten';
    state.rows[0]='Opening';moveRow(0,7);swapCards(70,79);
    window.result={text:state.cards[79],title:state.rows[7],preview:preview(state.cards[79]),csv:cardsFromCSV('"First, thought",Second\\n"Two\\nlines",Third').cards[10]};
  `);
  expect(dom.window.result).toEqual({ text: 'One two three four five six seven eight nine ten', title: 'Opening', preview: 'One two three four five six seven eight…', csv: 'Two\nlines' });
  dom.window.close();
});

test('Return saves and closes, while Shift+Return and IME confirmation keep editing', () => {
  const dom = open('alice').dom;
  const field = dom.window.document.querySelector('#thought');
  const dialog = dom.window.document.querySelector('#editor');
  let closed = 0;
  dialog.close = () => { closed++; };
  field.value = 'My complete note';
  const key = options => {
    const event = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...options });
    field.dispatchEvent(event); return event;
  };
  expect(key({ shiftKey: true }).defaultPrevented).toBe(false);
  expect(key({ isComposing: true }).defaultPrevented).toBe(false);
  expect(closed).toBe(0);
  expect(key({}).defaultPrevented).toBe(true);
  expect(closed).toBe(1);
  const saved = JSON.parse(dom.window.localStorage.getItem('learning-planning:alice'));
  expect(saved.boards[0].data.cards[0]).toBe('My complete note');
  dom.window.close();
});

test('trash clears only the selected note and persists the deletion', () => {
  const dom = evaluate('alice', "state.cards[0]='Delete me';state.cards[1]='Keep me';save();");
  const dialog = dom.window.document.querySelector('#editor');
  let closed = false;
  dialog.close = () => { closed = true; dialog.dispatchEvent(new dom.window.Event('close')); };
  dom.window.document.querySelector('#delete-note').click();
  const saved = JSON.parse(dom.window.localStorage.getItem('learning-planning:alice'));
  expect(saved.boards[0].data.cards[0]).toBe('');
  expect(saved.boards[0].data.cards[1]).toBe('Keep me');
  expect(closed).toBe(true);
  expect(dom.window.document.querySelector('[data-slot="0"]').classList.contains('empty')).toBe(true);
  dom.window.close();
});

test('New creates an editable date title without changing an existing board', () => {
  const { dom, win } = open('alice');
  const title = win.document.querySelector('#title');
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  title.value = 'Earlier planning';
  title.dispatchEvent(new win.Event('input'));
  win.document.querySelector('#new-board').click();
  expect(title.value).toBe(today);
  title.value = 'My lesson'; title.dispatchEvent(new win.Event('input'));
  const saved = win.localStorage.getItem('learning-planning:alice');
  const library = JSON.parse(saved);
  expect(library.boards).toHaveLength(2);
  expect(library.boards[0].data.title).toBe('Earlier planning');
  const reopened = open('alice', { 'learning-planning:alice': saved });
  expect(reopened.win.document.querySelector('#title').value).toBe('My lesson');
  expect(JSON.parse(reopened.win.localStorage.getItem('learning-planning:alice')).boards).toHaveLength(2);
  dom.window.close(); reopened.dom.window.close();
});

test('existing notes become a permanent editable checklist and preserve completion', () => {
  const dom=evaluate('alice', "state.todoMode=false;state.notes[0]='Prepare handouts\\nEmail parents';render();");
  const win=dom.window,doc=win.document;
  expect(doc.querySelector('#todo-toggle')).toBeNull();
  expect(doc.querySelectorAll('.todo-row')).toHaveLength(2);
  const check=doc.querySelector('.todo-row input');check.click();
  expect(doc.querySelector('.todo-row textarea').classList.contains('completed')).toBe(true);
  expect(doc.querySelector('.todo-row input').checked).toBe(true);
  const fields=doc.querySelectorAll('.todo-row textarea');
  fields[1].value='Email families';fields[1].dispatchEvent(new win.Event('input'));
  fields[1].setSelectionRange(fields[1].value.length,fields[1].value.length);
  fields[1].dispatchEvent(new win.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
  expect(doc.querySelectorAll('.todo-row')).toHaveLength(3);
  const third=doc.querySelectorAll('.todo-row textarea')[2];
  third.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Backspace',bubbles:true,cancelable:true}));
  const stored=win.localStorage.getItem('learning-planning:alice');
  const reopened=open('alice',{'learning-planning:alice':stored});
  expect(reopened.win.document.querySelector('#todo-toggle')).toBeNull();
  expect(reopened.win.document.querySelector('.todo-row input').checked).toBe(true);
  expect(reopened.win.document.querySelectorAll('.todo-row textarea')[1].value).toBe('Email families');
  dom.window.close();reopened.dom.window.close();
});

test('note completion is reversible, survives reload and follows card and row moves', () => {
  const dom=evaluate('alice', "state.cards[0]='Finished idea';state.cards[1]='Pending idea';render();window.moveTest=()=>{swapCards(0,1);moveRow(0,2)};");
  const win=dom.window,doc=win.document,dialog=doc.querySelector('#editor');
  dialog.showModal=()=>{};dialog.close=()=>dialog.dispatchEvent(new win.Event('close'));
  doc.querySelector('[data-slot="0"]').click();
  const toggle=doc.querySelector('#complete-note');
  toggle.click();
  expect(toggle.getAttribute('aria-pressed')).toBe('true');
  expect(doc.querySelector('[data-slot="0"]').classList.contains('dealt-with')).toBe(true);
  toggle.click();expect(doc.querySelector('[data-slot="0"]').classList.contains('dealt-with')).toBe(false);
  toggle.click();win.moveTest();
  expect(doc.querySelector('[data-slot="21"]').classList.contains('dealt-with')).toBe(true);
  expect(doc.querySelector('[data-slot="20"]').classList.contains('dealt-with')).toBe(false);
  const saved=win.localStorage.getItem('learning-planning:alice');
  const reopened=open('alice',{'learning-planning:alice':saved});
  expect(reopened.win.document.querySelector('[data-slot="21"]').classList.contains('dealt-with')).toBe(true);
  doc.querySelector('[data-slot="21"]').click();doc.querySelector('#delete-note').click();
  expect(JSON.parse(win.localStorage.getItem('learning-planning:alice')).boards[0].data.cardDone[21]).toBe(false);
  dom.window.close();reopened.dom.window.close();
});

test('Refresh archives full completed text, compacts unfinished cards, and is idempotent across reload', () => {
  const dom=evaluate('alice', "state.cards[0]='Completed note with more than eight words that must all survive';state.cardDone[0]=true;state.cards[7]='Keep in cell eight';state.notes=['Done task\\nPending task\\nAnother done task','Keep other notes'];state.todoMode=true;state.todoChecked=[true,false,true];render();");
  const win=dom.window,doc=win.document;
  doc.querySelector('#refresh-planner').click();
  const load=()=>JSON.parse(win.localStorage.getItem('learning-planning:alice')).boards[0].data;
  expect(load().archive).toHaveLength(3);
  expect(load().cards[0]).toBe('Keep in cell eight');expect(load().cardDone[0]).toBe(false);
  expect(load().cards[7]).toBe('');
  expect(load().notes).toEqual(['Pending task\nKeep other notes','']);
  doc.querySelector('#refresh-planner').click();expect(load().archive).toHaveLength(3);
  const reopened=open('alice',{'learning-planning:alice':win.localStorage.getItem('learning-planning:alice')});
  reopened.win.document.querySelector('#archive-dialog').showModal=()=>{};
  reopened.win.document.querySelector('#open-archive').click();
  expect(reopened.win.document.querySelectorAll('.archive-item')).toHaveLength(3);
  expect(reopened.win.document.querySelector('#archive-list').textContent).toContain('Completed note with more than eight words that must all survive');
  dom.window.close();reopened.dom.window.close();
});

test('Refresh rolls back when local persistence fails', () => {
  const dom=evaluate('alice', "state.cards[0]='Keep safe';state.cardDone[0]=true;state.cards[7]='Keep original position on failure';save();window.currentState=()=>state;");
  dom.window.Storage.prototype.setItem=()=>{throw new Error('Quota exceeded');};
  dom.window.document.querySelector('#refresh-planner').click();
  expect(dom.window.currentState().cards[0]).toBe('Keep safe');
  expect(dom.window.currentState().cardDone[0]).toBe(true);
  expect(dom.window.currentState().archive).toHaveLength(0);
  expect(dom.window.currentState().cards[7]).toBe('Keep original position on failure');
  dom.window.close();
});


test('combines saved notes into the tall checklist once without changing completed tasks', () => {
  const data = { title: 'Existing planner', rowCount: 8, columnCount: 10,
    rows: Array(10).fill(''), cards: Array(100).fill(''),
    notes: ['Finished task\nPending task', 'Old notes\nAnother note'], todoChecked: [true, false, true] };
  const key = 'learning-planning:alice';
  const saved = { [key]: JSON.stringify({ currentId: 'old', boards: [{ id: 'old', data }] }) };
  const first = open('alice', saved);
  const doc = first.win.document;
  expect(doc.querySelector('#notes-two')).toBeNull();
  expect(doc.querySelector('#todo-list').getAttribute('aria-label')).toBe('To-Do');
  expect([...doc.querySelectorAll('.todo-row textarea')].map(input => input.value))
    .toEqual(['Finished task', 'Pending task', 'Old notes', 'Another note']);
  expect([...doc.querySelectorAll('.todo-row input')].map(input => input.checked))
    .toEqual([true, false, false, false]);
  const stored = first.win.localStorage.getItem(key);
  const reopened = open('alice', { [key]: stored });
  expect(reopened.win.document.querySelectorAll('.todo-row')).toHaveLength(4);
  expect(JSON.parse(stored).boards[0].data.notes[1]).toBe('');
  first.dom.window.close(); reopened.dom.window.close();
});

test('drags Planner tasks with their completion checks and saves the new order across reopening', () => {
  const dom=evaluate('alice', "state.notes=['First task\\nCompleted task\\nLater task\\nLast task',''];state.todoChecked=[false,true,false,false];renderTodos();save();");
  const doc=dom.window.document;
  const rows=()=>[...doc.querySelectorAll('.todo-row')];
  expect(doc.querySelectorAll('.todo-row button')).toHaveLength(4);
  expect(rows().map(row=>row.querySelector('textarea').classList.contains('priority'))).toEqual([true,false,true,false]);
  const grip=rows()[3].querySelector('.todo-grip');
  grip.setPointerCapture=()=>{};
  doc.elementFromPoint=()=>rows()[0];
  const pointer=(type,y)=>grip.dispatchEvent(new dom.window.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:10,clientY:y}));
  pointer('pointerdown',100);pointer('pointermove',10);pointer('pointerup',10);
  expect(rows().map(row=>row.querySelector('textarea').value)).toEqual(['Last task','First task','Completed task','Later task']);
  expect(rows().map(row=>row.querySelector('input').checked)).toEqual([false,false,true,false]);
  const key='learning-planning:alice';
  const reopened=open('alice',{[key]:dom.window.localStorage.getItem(key)});
  expect([...reopened.win.document.querySelectorAll('.todo-row textarea')].map(input=>input.value)).toEqual(['Last task','First task','Completed task','Later task']);
  expect([...reopened.win.document.querySelectorAll('.todo-row input')].map(input=>input.checked)).toEqual([false,false,true,false]);
  rows()[0].querySelector('input').click();
  expect(rows().map(row=>row.querySelector('textarea').classList.contains('priority'))).toEqual([false,true,false,true]);
  dom.window.close();reopened.dom.window.close();
});

test('task handles support keyboard reordering and cancelled drags leave tasks intact',()=>{
  const dom=evaluate('alice', "state.notes=['First\\nSecond\\nThird',''];state.todoChecked=[false,true,false];renderTodos();save();");
  const doc=dom.window.document;
  let grip=doc.querySelector('[data-todo="1"] .todo-grip');
  grip.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true,cancelable:true}));
  expect([...doc.querySelectorAll('.todo-row textarea')].map(input=>input.value)).toEqual(['Second','First','Third']);
  expect(doc.activeElement).toBe(doc.querySelector('[data-todo="0"] .todo-grip'));
  grip=doc.activeElement;grip.setPointerCapture=()=>{};
  doc.elementFromPoint=()=>doc.querySelector('[data-todo="2"]');
  for(const [type,y] of [['pointerdown',10],['pointermove',100],['pointercancel',100],['pointerup',100]])grip.dispatchEvent(new dom.window.MouseEvent(type,{button:0,clientX:10,clientY:y}));
  expect([...doc.querySelectorAll('.todo-row textarea')].map(input=>input.value)).toEqual(['Second','First','Third']);
  dom.window.close();
});

test('calendar starts closed and all eight planning rows preserve their contents', () => {
 const dom=evaluate('calendar', `state.cards[0]='Keep original thought';state.rows[0]='Old topic';render();window.snapshot=JSON.parse(localStorage.getItem(LIBRARY_KEY));`);
 expect(dom.window.document.querySelectorAll('#board .row')).toHaveLength(8);
 expect(dom.window.document.querySelector('.calendar-disclosure').open).toBe(false);
 expect(dom.window.document.querySelector('#board .card').textContent).toContain('Keep original thought');
 expect(dom.window.document.querySelectorAll('.calendar-preview')).toHaveLength(0);
 expect(dom.window.snapshot.boards[0].data.cards[0]).toBe('Keep original thought');
 dom.window.close();
});
test('calendar saves full notes, limits previews, navigates years, and restores entries', () => {
 const dom=evaluate('calendar', `calendarMonth='2026-12';calendarDay='2026-12-31';renderCalendar();`);
 const doc=dom.window.document;
 for(let i=0;i<4;i++){
   doc.querySelector('[aria-label="Add calendar item"]').click();
   const note=doc.querySelector('#calendar-note');note.value='Important words with all the longer details '+i;note.dispatchEvent(new dom.window.Event('input'));
   doc.querySelector('[aria-label="Close calendar note"]').click();
 }
 expect(doc.querySelector('[data-date="2026-12-31"] .calendar-count').textContent).toBe('4');
 expect(doc.querySelectorAll('[data-date="2026-12-31"] .calendar-preview')).toHaveLength(3);
 expect(doc.querySelector('.calendar-preview').textContent).toBe('Important words');
 const saved=dom.window.localStorage.getItem('learning-planning:calendar');
 const restored=open('calendar',{'learning-planning:calendar':saved});
 expect(Object.values(JSON.parse(saved).boards[0].data.calendar)[0].text).toContain('all the longer details');
 doc.querySelector('[aria-label="Next month"]').click();
 expect(doc.querySelector('[aria-label="Calendar month"]').value).toBe('2027-01');
 expect(JSON.parse(restored.win.localStorage.getItem('learning-planning:calendar')).boards[0].data.calendar).toEqual(JSON.parse(saved).boards[0].data.calendar);
 restored.dom.window.close();dom.window.close();
});

test('Markdown exports unfinished content in board order with full text and line breaks', () => {
 const dom=evaluate('markdown', `
  state.title='My *board*';state.notes[0]='First task\\nFinished task\\n\\nLast task';state.todoChecked=[false,true,false,false];
  state.rows[0]='Ideas';state.cards[0]='Full text beyond the eight word preview limit stays here.\\nSecond line';
  state.cards[1]='Finished card';state.cardDone[1]=true;
  state.rows[1]='Empty topic';state.rows[2]='Next topic';state.cards[20]='Next card';
  state.footerNote='Private closing note';state.calendar={secret:{text:'Calendar only'}};
  window.markdown=boardMarkdown();
 `);
 expect(dom.window.markdown).toBe('**My \\*board\\***\n\n**To-dos**\n\n- [ ] First task\n- [ ] Last task\n\n**Ideas**\n\n- Full text beyond the eight word preview limit stays here\\.  \n  Second line\n\n**Next topic**\n\n- Next card\n');
 dom.window.close();
});

test('Markdown option downloads and copies identical text, reporting clipboard failure honestly', async () => {
 const dom=evaluate('markdown-click', `
  state.title='Export me';state.cards[0]='Keep this';
  window.exports=[];download=(text,type,ext)=>window.exports.push({text,type,ext});
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text}},configurable:true});
 `);
 const button=dom.window.document.querySelector('#export-markdown');
 await button.onclick();
 expect(dom.window.exports[0]).toEqual({text:dom.window.copied,type:'text/markdown;charset=utf-8',ext:'md'});
 expect(dom.window.copied).toContain('**Column 1**\n\n- Keep this');
 expect(dom.window.document.querySelector('#toast').textContent).toBe('Markdown downloaded and copied.');
 dom.window.navigator.clipboard.writeText=async()=>{throw Error('Denied')};
 dom.window.document.execCommand=()=>false;
 await button.onclick();
 expect(dom.window.exports).toHaveLength(2);
 expect(dom.window.document.querySelector('#toast').textContent).toContain('Clipboard unavailable');
 dom.window.close();
});

test('Refresh closes gaps in every column without mixing topics or changing order', () => {
 const dom=evaluate('compact', `state.cards[2]='First';state.cards[8]='Second';state.cards[19]='Other topic';state.cards[79]='Last topic';refreshPlanner();window.result=JSON.parse(JSON.stringify(state));refreshPlanner();window.again=JSON.parse(JSON.stringify(state));`);
 expect(dom.window.result.cards.slice(0,10)).toEqual(['First','Second',...Array(8).fill('')]);
 expect(dom.window.result.cards[10]).toBe('Other topic');
 expect(dom.window.result.cards[70]).toBe('Last topic');
 expect(dom.window.again).toEqual(dom.window.result);
 const saved=dom.window.localStorage.getItem('learning-planning:compact');
 const reopened=open('compact',{'learning-planning:compact':saved});
 expect(reopened.win.document.querySelector('[data-slot="10"]').textContent).toContain('Other topic');
 reopened.dom.window.close();dom.window.close();
});

test('expanded column is read-only, preserves full text and returns focus and scroll', () => {
 const dom=evaluate('expand', `state.rows[2]='Speaking notes';state.cards[20]='Full text beyond the preview limit with all details.\\nAnother line';state.cards[22]='Done point';state.cardDone[22]=true;render();`);
 const win=dom.window,doc=win.document,dialog=doc.querySelector('#expanded-column');
 dialog.showModal=()=>dialog.setAttribute('open','');
 dialog.close=()=>{dialog.removeAttribute('open');dialog.dispatchEvent(new win.Event('close'))};
 Object.defineProperty(win,'scrollY',{value:450});win.scrollTo=(x,y)=>{win.returnedTo=[x,y]};
 const before=win.localStorage.getItem('learning-planning:expand');
 doc.querySelector('[aria-label="Expand column 3"]').click();
 expect(dialog.open).toBe(true);
 expect(doc.querySelector('#expanded-title').textContent).toBe('Speaking notes');
 expect(dialog.querySelectorAll('.expanded-card')).toHaveLength(2);
 expect(dialog.querySelector('.expanded-card p').textContent).toBe('Full text beyond the preview limit with all details.\nAnother line');
 expect(dialog.querySelectorAll('textarea,input,[contenteditable],.card')).toHaveLength(0);
 expect(dialog.querySelectorAll('.dealt-with')).toHaveLength(1);
 doc.querySelector('#close-expanded').click();
 expect(dialog.open).toBe(false);
 expect(doc.activeElement.getAttribute('aria-label')).toBe('Expand column 3');
 expect(win.returnedTo).toEqual([0,450]);
 expect(doc.documentElement.style.overflow).toBe('');
 expect(win.localStorage.getItem('learning-planning:expand')).toBe(before);
 dom.window.close();
});

test('slides split at the first standalone divider and skip blank/completed cards', () => {
 const dom=evaluate('slides', `state.cards[0]='Audience --- inline\\nSecond line\\n  ---  \\nPrivate notes\\n---\\nMore notes';state.cards[1]='No divider';state.cards[2]='Done';state.cardDone[2]=true;window.slides=columnSlides(0);window.md=columnMarkdown(0);`);
 expect(dom.window.slides).toEqual([{text:'Audience --- inline\nSecond line',notes:'Private notes\n---\nMore notes'},{text:'No divider',notes:''}]);
 expect(dom.window.md).toContain('Private notes');expect(dom.window.md).toContain('Done');
 dom.window.close();
});

test('presenter navigation sends only audience text, resets scroll and closes audience on return', () => {
 const dom=evaluate('present', `state.cards[0]='Visible quote\\n---\\nSECRET NOTES';state.cards[2]='Second visible slide';state.cards[3]='Completed';state.cardDone[3]=true;render();`);
 const audience=new JSDOM('',{url:'https://example.test/'}),win=dom.window,doc=win.document,dialog=doc.querySelector('#column-presentation');
 let audienceClosed=false;
 win.open=()=>({document:audience.window.document,closed:false,focus:()=>{},close:()=>{audienceClosed=true}});
 win.scrollTo=()=>{};dialog.showModal=()=>dialog.setAttribute('open','');dialog.close=()=>{dialog.removeAttribute('open');dialog.dispatchEvent(new win.Event('close'))};
 doc.querySelector('[aria-label="Play column 1"]').click();
 expect(dialog.open).toBe(true);expect(doc.querySelector('#presenter-notes').textContent).toBe('SECRET NOTES');
 expect(audience.window.document.body.textContent).not.toContain('SECRET NOTES');
 expect(audience.window.document.querySelector('#audience-slide').textContent).toBe('Visible quote');
 expect(doc.querySelector('#presentation-count').textContent).toBe('1 / 2');
 audience.window.document.querySelector('#audience-slide').scrollTop=100;
 dialog.dispatchEvent(new win.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
 expect(audience.window.document.querySelector('#audience-slide').textContent).toBe('Second visible slide');
 expect(audience.window.document.querySelector('#audience-slide').scrollTop).toBe(0);
 expect(doc.querySelector('#next-slide').disabled).toBe(true);
 audience.window.document.dispatchEvent(new audience.window.KeyboardEvent('keydown',{key:'ArrowLeft'}));
 expect(doc.querySelector('#presentation-count').textContent).toBe('1 / 2');
 dialog.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
 expect(audienceClosed).toBe(true);expect(doc.activeElement.getAttribute('aria-label')).toBe('Play column 1');
 dom.window.close();audience.window.close();
});

test('blocked audience window can be retried and an empty column does not start playback', () => {
 const dom=evaluate('blocked', `state.cards[0]='Talk';render();`),win=dom.window,doc=win.document,dialog=doc.querySelector('#column-presentation');
 let calls=0;win.open=()=>{calls++;return null};win.scrollTo=()=>{};
 dialog.showModal=()=>dialog.setAttribute('open','');dialog.close=()=>{dialog.removeAttribute('open');dialog.dispatchEvent(new win.Event('close'))};
 doc.querySelector('[aria-label="Play column 1"]').click();
 expect(doc.querySelector('#presentation-status').textContent).toContain('blocked');
 doc.querySelector('#open-audience').click();expect(calls).toBe(2);
 dialog.close();doc.querySelector('[aria-label="Play column 2"]').click();
 expect(dialog.open).toBe(false);expect(calls).toBe(2);
 dom.window.close();
});

test('column md copies all text without downloading a file', async () => {
 const dom=evaluate('copy-column', `state.rows[0]='Topic';state.cards[0]='Quote\\n---\\nNotes';state.cards[2]='Done card';state.cardDone[2]=true;download=()=>{throw Error('Must not download')};Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text}}});render();`);
 await dom.window.document.querySelector('[aria-label="Copy column 1 as Markdown"]').onclick();
 expect(dom.window.copied).toContain('**Topic**');expect(dom.window.copied).toContain('Notes');expect(dom.window.copied).toContain('Done card');
 expect(dom.window.document.querySelector('#toast').textContent).toBe('Column copied');
 dom.window.close();
});
