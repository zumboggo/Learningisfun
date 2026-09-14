import { Client, Storage } from 'node-appwrite';
import { PRESENTATION_BUCKET } from '../functions/learning-content/src/presentation-files.js';
const storage=new Storage(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
try {
  const bucket=await storage.getBucket({bucketId:PRESENTATION_BUCKET});
  if(bucket.$permissions.length || bucket.fileSecurity) throw new Error('Presentation bucket must remain private.');
  console.log('Private presentation bucket ready');
} catch(error) {
  if(error.code!==404) throw error;
  await storage.createBucket({bucketId:PRESENTATION_BUCKET,name:'Class PowerPoints',permissions:[],fileSecurity:false,enabled:true,maximumFileSize:5*1024*1024,allowedFileExtensions:['ppt','pptx'],encryption:true,antivirus:true});
  console.log('Created private PowerPoint storage (5 MB per file)');
}
