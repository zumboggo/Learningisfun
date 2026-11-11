// Idempotently import the verified owner's reference curriculum. No release jobs or cards are changed.
import {Client,Databases,Functions,Users} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {privateVocabulary} from '../functions/learning-content/src/private-vocabulary.js';
loadEnvFile(join(homedir(),'.config/learningisfun/appwrite.env'));
const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY),functions=new Functions(client),db=new Databases(client),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const variables=await functions.listVariables({functionId:'learning-content'}),configured=variables.variables.find(v=>v.key==='OWNER_ACCOUNT_ID');
if(!configured)throw Error('Verified owner is not configured.');
// Secret variable values are intentionally unavailable through the admin API.
// Reuse the original onboarding verification rather than change or reveal that secret.
const classes=await Promise.all(['e24ec8d9-21d7-4c32-a30e-08655c2f4e65','88421c66-9cda-4002-8e15-086312b7805e'].map(id=>db.getDocument(databaseId,'classes',id)));
if(new Set(classes.map(c=>c.teacherId)).size!==1)throw Error('Established class owners disagree.');
const owner=classes[0].teacherId,account=await new Users(client).get({userId:owner});
if(!/^(davidh|david hepting)$/i.test(account.name)||configured.value&&configured.value!==owner)throw Error('Owner verification failed.');
const profile=await db.getDocument(databaseId,'users',owner);if(!['teacher','admin'].includes(profile.role))throw Error('Owner profile is not a teacher.');
process.env.OWNER_ACCOUNT_ID=owner;
const lists=await privateVocabulary({db,databaseId,userId:owner});
console.log('Private owner curriculum ready:',lists.filter(l=>l.legacy).map(l=>({name:l.name,weeks:l.weeks.length}))); 
