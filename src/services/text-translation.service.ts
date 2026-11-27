import {db} from '@/db/schema';
import {executeLearningContent} from './learning-content.service';
export type TranslationMode='off'|'paragraph'|'sentence';
export interface TranslationPair {english:string;translation:string}
export interface TranslationRequest {textId:string;paragraphId:string;level:string;language:string;content:string}
export interface TranslationCache {key:string;pairs:TranslationPair[]}
export const translationLanguages=[['zh-Hans','Chinese · 简体中文'],['zh-Hant','Chinese · 繁體中文'],['ja','Japanese · 日本語'],['ko','Korean · 한국어'],['ar','Arabic · العربية'],['bn','Bengali · বাংলা'],['de','German · Deutsch'],['es','Spanish · Español'],['fa','Persian · فارسی'],['fr','French · Français'],['hi','Hindi · हिन्दी'],['id','Indonesian · Bahasa Indonesia'],['it','Italian · Italiano'],['ms','Malay · Bahasa Melayu'],['my','Burmese · မြန်မာ'],['ne','Nepali · नेपाली'],['pt','Portuguese · Português'],['ru','Russian · Русский'],['ta','Tamil · தமிழ்'],['th','Thai · ไทย'],['tr','Turkish · Türkçe'],['uk','Ukrainian · Українська'],['ur','Urdu · اردو'],['vi','Vietnamese · Tiếng Việt']];
export async function translationKey(request:TranslationRequest,context:string) {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([request,context,'bilingual-v3-gemini31'])));
  return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function getTranslation(request:TranslationRequest,context:string,active:()=>boolean):Promise<TranslationPair[]> {
  const cacheDb=db;
  const key=await translationKey(request,context);
  const cached=await cacheDb.text_translations.get(key);
  if(cached)return cached.pairs;
  if(!navigator.onLine)throw Error('Translation is not saved on this device. Connect to load it.');
  for(let attempt=0;attempt<65&&active();attempt++) {
    let result:{status:string;pairs?:TranslationPair[]};
    try{result=await executeLearningContent({...request,action:'generateTextTranslation'});}
    catch(cause){
      // This server rejection occurs before billing; longer readings can wait safely.
      if(cause instanceof Error&&cause.message==='Please wait a minute before generating again.'){
        await new Promise(resolve=>setTimeout(resolve,15000));continue;
      }
      throw cause;
    }
    if(result.status==='ready'&&result.pairs) {
      if(result.pairs.map(p=>p.english).join('')!==request.content)throw Error('Translation did not match the English');
      if(active())await cacheDb.text_translations.put({key,pairs:result.pairs});return result.pairs;
    }
    await new Promise(resolve=>setTimeout(resolve,3000));
  }
  throw Error('Translation is still being prepared. Please retry shortly.');
}
export async function reportTranslation(request:TranslationRequest){await executeLearningContent({...request,action:'reportTextTranslation'});}
