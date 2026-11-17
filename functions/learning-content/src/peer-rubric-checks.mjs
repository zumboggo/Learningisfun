import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validatePeerRubric,peerRatingData} from './peer-rubric.js';
const rubric={name:'Debate',columns:['Start','Strong','Excellent','Outstanding'],rows:[{id:'evidence',label:'Evidence',description:'Support your claim',points:[0,2,5,10]},{id:'clarity',label:'Clarity',description:'',points:[0,1,2,4]}]};
test('validates custom dimensions, labels and finite nonnegative points',()=>{
 assert.equal(validatePeerRubric(rubric),true);
 for(const bad of [{...rubric,name:''},{...rubric,columns:[]},{...rubric,rows:[...rubric.rows,rubric.rows[0]]},...[-1,NaN,Infinity,1001].map(p=>({...rubric,rows:[{...rubric.rows[0],points:[p,2,5,10]}]})),{...rubric,rows:[{...rubric.rows[0],points:[0,0,0,0]}]}])assert.equal(validatePeerRubric(bad),false);
});
test('enforces saved rubric for submission and moderation, ignoring unknown ratings',()=>{
 const activity={rubricJson:JSON.stringify(rubric)};
 assert.equal(peerRatingData(activity,{evidence:5,clarity:1}),null);
 assert.equal(peerRatingData(activity,{evidence:1}),null);
 assert.deepEqual(JSON.parse(peerRatingData(activity,{evidence:4,clarity:2,extra:99}).ratingsJson),{evidence:4,clarity:2});
 assert.equal(peerRatingData({}, {poise:4,voice:2,life:2,eyeContact:2,gestures:2,speed:2}),null);
 assert.equal(peerRatingData({}, {poise:3,voice:2,life:2,eyeContact:2,gestures:2,speed:2}).poise,3);
});
