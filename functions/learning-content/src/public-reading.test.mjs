import { expect, test, vi } from 'vitest';
import { readPublicText, publicSharingAction } from './public-reading.js';
import { authorizeTextMutation } from './original-pdf.js';
const harness=()=>{
  const text={$id:'text',teacherId:'teacher',title:'Public article',author:'Author',source:'Source',status:'published',publicReadEnabled:true,secret:'private',classId:'blue'};
  const db={getDocument:vi.fn(async()=>text),listDocuments:vi.fn(async()=>({documents:[{$id:'p',textId:'text',sortOrder:0,content:'A paragraph',private:'not shared'}]})),updateDocument:vi.fn(async(_,__,___,patch)=>Object.assign(text,patch))};
  const read=(body={})=>readPublicText({body:{action:'read',textId:'text',...body},db,databaseId:'main'});
  return {text,db,read};
};
test('anonymous reads return only allowlisted text and paragraph fields, with no private collections',async()=>{
  const {read,db}=harness();const result=await read();
  expect(result.text).not.toHaveProperty('teacherId');expect(result.text).not.toHaveProperty('classId');expect(result.text).not.toHaveProperty('secret');
  expect(result.paragraphs[0]).toEqual({$id:'p',textId:'text',sortOrder:0,content:'A paragraph'});
  expect(db.listDocuments.mock.calls.every(args=>args[1]==='text_paragraphs')).toBe(true);
});
test('missing flags, class-only readings, drafts and archived texts are not public',async()=>{
  for(const patch of [{publicReadEnabled:false},{publicReadEnabled:undefined},{status:'draft'},{status:'archived'}]){const {text,read,db}=harness();Object.assign(text,patch);await expect(read()).rejects.toThrow();expect(db.listDocuments).not.toHaveBeenCalled();}
});
test('public entry rejects all write actions, listing, and arbitrary identifiers',async()=>{
  const {read,db}=harness();for(const action of ['mutate','readTexts','listReadingDiscussions','setTextPublicSharing'])await expect(read({action})).rejects.toThrow();
  await expect(read({textId:'../../users'})).rejects.toThrow();expect(db.getDocument).not.toHaveBeenCalled();
});
test('only owner can toggle sharing, disabling revokes reads, and old records stay private',async()=>{
  const {db,text,read}=harness();
  for(const [role,userId] of [['student','teacher'],['parent','teacher'],['teacher','another']])await expect(publicSharingAction({body:{action:'setTextPublicSharing',textId:'text',enabled:true},profile:{role},userId,db,databaseId:'main'})).rejects.toThrow('owner');
  expect(db.updateDocument).not.toHaveBeenCalled();
  await publicSharingAction({body:{action:'setTextPublicSharing',textId:'text',enabled:false},profile:{role:'teacher'},userId:'teacher',db,databaseId:'main'});
  expect(text.publicReadEnabled).toBe(false);await expect(read()).rejects.toThrow();
});
test('stale text updates cannot turn public sharing back on',async()=>{
  const {db}=harness(),data={title:'Edited',publicReadEnabled:true};
  await authorizeTextMutation({collection:'texts',id:'text',data,userId:'teacher',db,databaseId:'main'});
  expect(data).not.toHaveProperty('publicReadEnabled');
});
test('new text creation respects explicit on or off and fails closed for older clients',async()=>{
  for(const value of [true,false,undefined]){const data={publicReadEnabled:value},db={getDocument:async()=>{throw Object.assign(Error('Missing'),{code:404});}};
    await authorizeTextMutation({collection:'texts',id:'new',data,userId:'teacher',db,databaseId:'main'});expect(data.publicReadEnabled).toBe(value===true);}
});
