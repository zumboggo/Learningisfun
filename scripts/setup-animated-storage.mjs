import {Client,Storage} from 'node-appwrite';
for(const key of ['APPWRITE_ENDPOINT','APPWRITE_PROJECT_ID','APPWRITE_API_KEY'])if(!process.env[key])throw Error('Missing '+key);
const storage=new Storage(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
try{await storage.getBucket({bucketId:'animated-episodes'});console.log('Animated story storage already exists');}catch(e){if(e.code!==404)throw e;await storage.createBucket({bucketId:'animated-episodes',name:'Animated episodes',permissions:[],fileSecurity:true,enabled:true,maximumFileSize:8000000,allowedFileExtensions:['json'],compression:'gzip',encryption:true,antivirus:true});console.log('Created private animated story storage');}
