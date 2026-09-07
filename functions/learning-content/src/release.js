import { Client, Databases } from 'node-appwrite';
import { releaseDue } from './planning.js';

export default async ({req,res,error}) => {
  if(req.headers['x-appwrite-trigger'] !== 'schedule')return res.json({error:'Scheduled execution only'},403);
  try {
    const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
    return res.json(await releaseDue(new Databases(client),process.env.APPWRITE_DATABASE_ID||'main'));
  } catch(cause) { error(cause.message); return res.json({error:'Release processing failed'},500); }
};
