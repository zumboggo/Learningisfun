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
  expect(win.document.querySelector('#notes-one')).toBeTruthy();
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

test('To Do converts notes into persistent editable checklist lines and preserves notes when toggled off', () => {
  const { dom, win } = open('alice');
  const doc=win.document, notes=doc.querySelector('#notes-one'), toggle=doc.querySelector('#todo-toggle');
  notes.value='Prepare handouts\nEmail parents';notes.dispatchEvent(new win.Event('input'));
  toggle.click();
  expect(notes.hidden).toBe(true);
  expect(doc.querySelectorAll('.todo-row')).toHaveLength(2);
  const check=doc.querySelector('.todo-row input');check.click();
  expect(doc.querySelector('.todo-row textarea').classList.contains('completed')).toBe(true);
  toggle.click();expect(notes.hidden).toBe(false);expect(notes.value).toBe('Prepare handouts\nEmail parents');
  toggle.click();expect(doc.querySelector('.todo-row input').checked).toBe(true);
  const fields=doc.querySelectorAll('.todo-row textarea');
  fields[1].value='Email families';fields[1].dispatchEvent(new win.Event('input'));
  fields[1].setSelectionRange(fields[1].value.length,fields[1].value.length);
  fields[1].dispatchEvent(new win.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
  expect(doc.querySelectorAll('.todo-row')).toHaveLength(3);
  const third=doc.querySelectorAll('.todo-row textarea')[2];
  third.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Backspace',bubbles:true,cancelable:true}));
  const stored=win.localStorage.getItem('learning-planning:alice');
  const reopened=open('alice',{'learning-planning:alice':stored});
  expect(reopened.win.document.querySelector('#todo-toggle').checked).toBe(true);
  expect(reopened.win.document.querySelector('.todo-row input').checked).toBe(true);
  expect(reopened.win.document.querySelectorAll('.todo-row textarea')[1].value).toBe('Email families');
  dom.window.close();reopened.dom.window.close();
});
