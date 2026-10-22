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

test('Refresh archives full completed text, keeps unfinished positions, and is idempotent across reload', () => {
  const dom=evaluate('alice', "state.cards[0]='Completed note with more than eight words that must all survive';state.cardDone[0]=true;state.cards[7]='Keep in cell eight';state.notes=['Done task\\nPending task\\nAnother done task','Keep other notes'];state.todoMode=true;state.todoChecked=[true,false,true];render();");
  const win=dom.window,doc=win.document;
  doc.querySelector('#refresh-planner').click();
  const load=()=>JSON.parse(win.localStorage.getItem('learning-planning:alice')).boards[0].data;
  expect(load().archive).toHaveLength(3);
  expect(load().cards[0]).toBe('');expect(load().cardDone[0]).toBe(false);
  expect(load().cards[7]).toBe('Keep in cell eight');
  expect(load().notes).toEqual(['Pending task','Keep other notes']);
  doc.querySelector('#refresh-planner').click();expect(load().archive).toHaveLength(3);
  const reopened=open('alice',{'learning-planning:alice':win.localStorage.getItem('learning-planning:alice')});
  reopened.win.document.querySelector('#archive-dialog').showModal=()=>{};
  reopened.win.document.querySelector('#open-archive').click();
  expect(reopened.win.document.querySelectorAll('.archive-item')).toHaveLength(3);
  expect(reopened.win.document.querySelector('#archive-list').textContent).toContain('Completed note with more than eight words that must all survive');
  dom.window.close();reopened.dom.window.close();
});

test('Refresh rolls back when local persistence fails', () => {
  const dom=evaluate('alice', "state.cards[0]='Keep safe';state.cardDone[0]=true;save();window.currentState=()=>state;");
  dom.window.Storage.prototype.setItem=()=>{throw new Error('Quota exceeded');};
  dom.window.document.querySelector('#refresh-planner').click();
  expect(dom.window.currentState().cards[0]).toBe('Keep safe');
  expect(dom.window.currentState().cardDone[0]).toBe(true);
  expect(dom.window.currentState().archive).toHaveLength(0);
  dom.window.close();
});
