import {Client,Databases,Query} from 'node-appwrite';
const c=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY),db=new Databases(c),d=process.env.APPWRITE_DATABASE_ID||'main',classId='5a726282-4771-4774-8213-d9329c124bbc';
const cls=await db.getDocument(d,'classes',classId);
console.log(JSON.stringify({classId:cls.$id,courseName:cls.courseName,name:cls.name,status:cls.status}));
const as=await db.listDocuments(d,'text_assignments',[Query.equal('classId',classId),Query.limit(100)]);
for(const a of as.documents){const t=await db.getDocument(d,'texts',a.textId);console.log(JSON.stringify({id:t.$id,title:t.title,status:t.status,assignment:a.$id,assignedAt:a.assignedAt,dueDate:a.dueDate,isAssignedReading:a.isAssignedReading}));}
