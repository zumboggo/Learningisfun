import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {readFileSync,writeFileSync,existsSync,chmodSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {Client,Functions,Databases} from 'node-appwrite';
loadEnvFile(homedir()+'/.config/learningisfun/appwrite.env');
const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY),functions=new Functions(client),db=new Databases(client);
const collection=await db.getCollection({databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:'teacher_workspace'});
if(collection.$permissions.length||collection.documentSecurity)throw Error('Credential storage must remain server-only. Inspect workspace permissions before rollout.');
const variables=await functions.listVariables({functionId:'learning-content'});
if(variables.variables.some(v=>v.key==='AI_CREDENTIAL_ENCRYPTION_KEY'))console.log('Encryption secret already configured; no rotation performed.');
else{
 const file=homedir()+'/.config/learningisfun/ai-credential-encryption.key';
 if(!existsSync(file))writeFileSync(file,randomBytes(32).toString('hex')+'\n',{mode:0o600,flag:'wx'});
 chmodSync(file,0o600);const value=readFileSync(file,'utf8').trim();if(!/^[a-f0-9]{64}$/i.test(value))throw Error('Invalid encryption backup.');
 await functions.createVariable({functionId:'learning-content',variableId:'ai-credential-encryption',key:'AI_CREDENTIAL_ENCRYPTION_KEY',value,secret:true});
 console.log('Server encryption configured; protected backup retained outside the repository.');
}
