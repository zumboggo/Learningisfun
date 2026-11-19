import {Client,Databases,Users,ID} from 'node-appwrite';
import {WORKSHOP_CLASS_ID} from './workshop-policy.js';
import {selfProfile} from './profiles.js';

// Temporary, code-gated registration for the in-person workshop. No existing
// account can be claimed or modified through this unauthenticated endpoint.
export default async ({req,res}) => {
 try {
  const body=JSON.parse(req.bodyText||'{}');
  if(Date.now()>Date.parse('2026-11-20T16:00:00Z'))return res.json({created:false});
  const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
  const db=new Databases(client),users=new Users(client),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
  const cls=await db.getDocument(databaseId,'classes',WORKSHOP_CLASS_ID);
  if(cls.status!=='active'||!cls.joinCodeActive||typeof body.joinCode!=='string'||body.joinCode.trim().toUpperCase()!==cls.joinCode)return res.json({created:false});
  if(typeof body.email!=='string'||typeof body.password!=='string'||body.password.length<8||typeof body.name!=='string'||!body.name.trim())return res.json({error:'Enter your name, email, and a password of at least 8 characters.'},400);
  const account=await users.create({userId:ID.unique(),email:body.email.trim().toLowerCase(),password:body.password,name:body.name.trim()});
  await selfProfile({db,users,databaseId,userId:account.$id});
  return res.json({created:true});
 }catch(e){return res.json({error:e.code===409?'That email already has an account. Choose sign in.':'Could not create the account. Check your details and try again.'},e.code===409?409:400);}
};
