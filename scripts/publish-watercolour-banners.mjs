import {Client,Databases,Storage} from 'node-appwrite';
import {InputFile} from 'node-appwrite/file';
import {writeFile} from 'node:fs/promises';
const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(client),storage=new Storage(client),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const entries=[
 ['world-literature-red','09d7f0a7-4c29-462c-820f-e11ea914d375'],
 ['world-literature-blue','b0496f4d-5fe7-4cc2-8940-d1ba2e50a28c'],
 ['ethics-leadership','e24ec8d9-21d7-4c32-a30e-08655c2f4e65'],
 ['ap-english','88421c66-9cda-4002-8e15-086312b7805e'],
 ['boys-advisory','585406db-6bcf-4fc7-b42f-1f5e4bc8a540'],
 ['english-corner','7e5810c3-dfac-4595-ba51-0e20e645e727'],
 ['lifeplus-workshop','5a726282-4771-4774-8213-d9329c124bbc'],
];
const result=[];
for(const [name,id] of entries){
 const cls=await db.getDocument(databaseId,'classes',id);
 if(cls.teacherId!=='6a7bc5ea003e7aecc810')throw new Error('Unexpected class owner');
 const fileId=`wc26_${name}`;
 const previous=JSON.parse(cls.bannerJson||'null');
 if(previous && previous.fileId!==fileId)throw new Error('Preserving an existing banner for '+name);
 try {await storage.getFile({bucketId:'original-pdfs',fileId});}
 catch(error){if(error.code!==404)throw error;await storage.createFile({bucketId:'original-pdfs',fileId,file:InputFile.fromPath(`assets/class-banners/${name}.png`)});}
 const banner={fileId,x:50,y:65};
 if(!previous)await db.updateDocument(databaseId,'classes',id,{bannerJson:JSON.stringify(banner)});
 const verified=await db.getDocument(databaseId,'classes',id);
 if(JSON.parse(verified.bannerJson).fileId!==fileId)throw new Error('Banner verification failed');
 result.push({name,classId:id,banner:JSON.parse(verified.bannerJson)});
 console.log('Verified:',cls.courseName,cls.name);
}
await writeFile('assets/class-banners/published.json',JSON.stringify(result,null,2)+'\n');
