import { executeLearningContent } from './learning-content.service';

export const IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/g;
export async function hostReadingImages(content: string, textId: string): Promise<string> {
  if(content.includes('[Image could not be copied — upload it using Add picture.]'))throw new Error('A picture could not be copied. Replace its placeholder using Add picture, or remove the placeholder before saving.');
  const replacements = new Map<string, string>();
  for (const match of content.matchAll(IMAGE_PATTERN)) {
    const source = match[2];
    if (/^reading-image:[\w-]+:img_[a-f0-9]{10}_[a-f0-9]{20}$/.test(source)) { replacements.set(source, `reading-image:${textId}:${source.split(':')[2]}`); continue; }
    if (replacements.has(source)) continue;
    try {
      const result = await executeLearningContent<{fileId:string}>({action:'importReadingImage', source});
      replacements.set(source, `reading-image:${textId}:${result.fileId}`);
    } catch {
      throw new Error(`Could not save picture “${match[1] || 'Article image'}”. The source may block downloads or the picture may exceed 5 MB. Use Add picture to upload a copy, or remove its image entry and save again. Your text remains in the editor.`);
    }
  }
  return content.replace(IMAGE_PATTERN, (whole, alt: string, source: string) => replacements.has(source) ? `![${alt}](${replacements.get(source)})` : whole);
}
export async function imageFileMarkdown(file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Choose a PNG, JPEG, WebP or GIF of 5 MB or smaller.');
  const source = await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Could not read this picture.'));reader.readAsDataURL(file);});
  return `![${file.name.replace(/[[\]\r\n]/g,' ')}](${source})`;
}
