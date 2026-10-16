import {test,expect,vi} from 'vitest';
import {familyContactsAction,FAMILY_CONTACT_COLLECTION} from './family-contacts.js';
import {FAMILY_CONTACT_CLASS_ID,validateFamilyContacts,familyContactsTsv} from './family-contact-schema.js';
const missing=()=>Object.assign(new Error('Missing'),{code:404});
const values=()=>['9','Example Student','','M','Example Country','Example Parent','00123456789','parent@example.com','','',''];
function harness(){
 const records=new Map();
 const db={
  getDocument:vi.fn(async(_,collection,id)=>{if(collection==='classes')return {$id:FAMILY_CONTACT_CLASS_ID,teacherId:'owner',status:'active'};if(!records.has(id))throw missing();return records.get(id)}),
  createDocument:vi.fn(async(_,collection,id,data,permissions)=>{if(records.has(id))throw Object.assign(new Error('Conflict'),{code:409});const r={$id:id,...data,$permissions:permissions};records.set(id,r);return r}),
  updateDocument:vi.fn(async(_,collection,id,data)=>{const r={...records.get(id),...data};records.set(id,r);return r}),
  listDocuments:vi.fn(async()=>({documents:[...records.values()]})),
 };
 const ctx={db,databaseId:'main',userId:'student-a',profile:{role:'student'},memberClassIds:new Set([FAMILY_CONTACT_CLASS_ID])};
 const call=(body,overrides={})=>familyContactsAction({...ctx,...overrides,body:{classId:FAMILY_CONTACT_CLASS_ID,...body}});
 return {records,db,call};
}
test('own authenticated identity controls saving, reading and updates; retries keep one private row',async()=>{
 const {call,db,records}=harness();
 const payload={action:'saveFamilyContacts',confirmed:true,values:values(),userId:'student-b'};
 await call(payload);await call(payload);
 expect(records.size).toBe(1);expect(db.createDocument.mock.calls[0][4]).toEqual([]);
 expect([...records.values()][0].userId).toBe('student-a');
 const own=await call({action:'readFamilyContacts',userId:'student-b'});
 expect(own.response.values[6]).toBe('00123456789');expect(own).not.toHaveProperty('rows');expect(db.listDocuments).not.toHaveBeenCalled();
 const other=await call({action:'readFamilyContacts',userId:'student-a'},{userId:'student-b'});
 expect(other.response).toBeNull();
 const corrected=values();corrected[6]='+86 0123456789';await call({...payload,values:corrected});
 expect(records.size).toBe(1);expect([...records.values()][0].valuesJson).toContain('+86 0123456789');
});
test.each(['parent','substitute','teacher','admin'])('non-owner %s cannot read or save contact details',async role=>{
 const {call,db}=harness();
 for(const action of ['readFamilyContacts','saveFamilyContacts'])await expect(call({action,confirmed:true,values:values()},{profile:{role},userId:'other'})).rejects.toMatchObject({code:403});
 expect(db.listDocuments).not.toHaveBeenCalled();expect(db.createDocument).not.toHaveBeenCalled();
});
test('wrong class, inactive class and missing student membership are rejected',async()=>{
 const {call,db}=harness();
 await expect(call({action:'readFamilyContacts',classId:'other-class'})).rejects.toMatchObject({code:403});
 expect(db.getDocument).not.toHaveBeenCalled();
 await expect(call({action:'readFamilyContacts'},{memberClassIds:new Set()})).rejects.toMatchObject({code:403});
 db.getDocument.mockResolvedValue({teacherId:'owner',status:'archived'});
 await expect(call({action:'readFamilyContacts'},{userId:'owner',profile:{role:'teacher'}})).rejects.toMatchObject({code:403});
});
test('only owning teacher lists rows; student-mode teacher preview never fetches them',async()=>{
 const {call,db}=harness();await call({action:'saveFamilyContacts',confirmed:true,values:values()});
 const owner={userId:'owner',profile:{role:'teacher'}};
 const preview=await call({action:'readFamilyContacts',preview:true},owner);
 expect(preview).toEqual({teacher:false,preview:true,response:null});expect(db.listDocuments).not.toHaveBeenCalled();
 const result=await call({action:'readFamilyContacts'},owner);
 expect(result.teacher).toBe(true);expect(result.rows).toHaveLength(1);
 expect(db.listDocuments.mock.calls[0][1]).toBe(FAMILY_CONTACT_COLLECTION);
 expect(JSON.parse(db.listDocuments.mock.calls[0][2][0])).toMatchObject({attribute:'classId',values:[FAMILY_CONTACT_CLASS_ID]});
 await expect(call({action:'saveFamilyContacts',confirmed:true,values:values()},owner)).rejects.toMatchObject({code:403});
});
test('validation rejects missing confirmation, malformed fields, wrong grade and invalid emails',async()=>{
 const {call,db}=harness();
 await expect(call({action:'saveFamilyContacts',values:values()})).rejects.toMatchObject({code:400});
 for(const [i,value] of [[0,'10'],[1,''],[5,''],[6,''],[7,'bad-email'],[8,'line\nbreak'],[2,'a'.repeat(201)]]){
  const bad=values();bad[i]=value;await expect(call({action:'saveFamilyContacts',confirmed:true,values:bad})).rejects.toMatchObject({code:400});
 }
 expect(db.createDocument).not.toHaveBeenCalled();expect(validateFamilyContacts(values())).toEqual(values());
});
test('Excel export matches 11 workbook columns, omits metadata, sorts names and preserves phone text safely',()=>{
 const first=values();first[1]='Zed';first[2]='=HYPERLINK("https://example.com")';first[9]='+86 00123';
 const second=values();second[1]='Alice';
 const lines=familyContactsTsv([{values:first,userId:'hidden-id',updatedAt:'hidden-date'},{values:second}]).split('\n');
 expect(lines).toHaveLength(2);expect(lines[0].split('\t')).toHaveLength(11);
 expect(lines[0].split('\t')[1]).toBe('Alice');expect(lines[0].split('\t')[6]).toBe("'00123456789");
 expect(lines[1].split('\t')[2]).toBe("'=HYPERLINK(\"https://example.com\")");expect(lines[1].split('\t')[9]).toBe("'+86 00123");
 expect(lines.join()).not.toContain('hidden-');
});
