import {readRecord,fail} from './teacher-workspace.js';
import {resolveBilling} from './ai-billing.js';
// Official pricing and input schemas verified 2026-11-09. Reverify before extending.
// https://replicate.com/pricing and /black-forest-labs/{model}/api/schema
export const PRICE_VALID_UNTIL='2026-12-09T00:00:00Z';
export const IMAGE_MODELS=[
 {id:'schnell',label:'Economy · FLUX Schnell',model:'black-forest-labs/flux-schnell',price:.003},
 {id:'dev',label:'Standard · FLUX Dev',model:'black-forest-labs/flux-dev',price:.025},
 {id:'pro',label:'High quality · FLUX 1.1 Pro',model:'black-forest-labs/flux-1.1-pro',price:.04},
];
export function modelInput(id,prompt){const base={prompt,aspect_ratio:'16:9',output_format:'webp',output_quality:80};if(id==='pro')return {...base,safety_tolerance:2,prompt_upsampling:false};return {...base,num_outputs:1,megapixels:'1',num_inference_steps:id==='dev'?28:4,go_fast:id==='schnell',disable_safety_checker:false,...(id==='dev'?{guidance:3}:{})};}
export async function imageCatalog(args){const c=await readRecord(args.db,args.databaseId,args.userId,'ai-connection:replicate'),settings=await readRecord(args.db,args.databaseId,args.userId,'ai-image-settings'),personal=!!c.value?.credentialId,ceiling=personal?(settings.value?.ceiling??.01):.01,available=(personal||!!process.env.REPLICATE_API_TOKEN)&&Date.now()<Date.parse(PRICE_VALID_UNTIL);return {billing:personal?'personal':'shared',ceiling,available,validUntil:PRICE_VALID_UNTIL,models:IMAGE_MODELS.map(m=>({...m,enabled:available&&m.price<=ceiling&&(personal||m.price<=.01)}))};}
export async function imageQuote(args){const catalog=await imageCatalog(args),model=IMAGE_MODELS.find(m=>m.id===(args.body.modelId||'schnell'));if(!model)fail('Choose a supported image model.');if(Date.now()>=Date.parse(PRICE_VALID_UNTIL))fail('Image pricing needs verification before generating. You can still upload images.',503);if(model.price>catalog.ceiling)fail('This model exceeds your per-image ceiling. Review AI & billing settings before generating.');if(catalog.billing==='shared'&&model.price>.01)fail('Connect your personal Replicate account to use this model.');if(args.body.expectedBilling&&args.body.expectedBilling!==catalog.billing)fail('Your billing account changed. Refresh the cost before generating.',409);const billing=await resolveBilling(args,args.userId,'replicate');return {model,billing,input:modelInput(model.id,args.body.prompt)};}
