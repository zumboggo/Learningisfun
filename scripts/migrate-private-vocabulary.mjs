// Idempotently import the verified owner's reference curriculum. No release jobs or cards are changed.
import {Client,Databases,Functions} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {privateVocabulary} from '../functions/learning-content/src/private-vocabulary.js';
loadEnvFile(join(homedir(),'.config/learningisfun/appwrite.env'));
const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY),functions=new Functions(client),db=new Databases(client),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const variables=await functions.listVariables({functionId:'learning-content'}),owner=variables.variables.find(v=>v.key==='OWNER_ACCOUNT_ID')?.value;
if(!owner)throw Error('Verified owner is not configured.');
const profile=await db.getDocument(databaseId,'users',owner);if(!['teacher','admin'].includes(profile.role))throw Error('Owner profile is not a teacher.');
process.env.OWNER_ACCOUNT_ID=owner;
const lists=await privateVocabulary({db,databaseId,userId:owner});
console.log('Private owner curriculum ready:',lists.filter(l=>l.legacy).map(l=>({name:l.name,weeks:l.weeks.length}))); 
