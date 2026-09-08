import { Client, Storage } from 'node-appwrite';
import { PDF_BUCKET } from '../functions/learning-content/src/original-pdf.js';
const storage = new Storage(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
try {
  const bucket = await storage.getBucket({ bucketId: PDF_BUCKET });
  if (bucket.$permissions.length || bucket.fileSecurity) throw new Error('Existing PDF bucket is not private; review its permissions before continuing.');
  console.log('Private PDF bucket already exists');
} catch (error) {
  if (error.code !== 404) throw error;
  await storage.createBucket({ bucketId: PDF_BUCKET, name: 'Original reading PDFs', permissions: [], fileSecurity: false, enabled: true, maximumFileSize: 5 * 1024 * 1024, allowedFileExtensions: ['pdf'], encryption: true, antivirus: true });
  console.log('Created private original PDF bucket (5 MB limit)');
}
