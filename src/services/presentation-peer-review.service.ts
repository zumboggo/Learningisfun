import { executeLearningContent } from '@/services/learning-content.service';
import type { PeerReviewActivity, PresentationPeerReview, PvlegsRating } from '@/types';

export const PVLEGS_CATEGORIES = ['poise','voice','life','eyeContact','gestures','speed'] as const;
export const PVLEGS_LABELS: Record<(typeof PVLEGS_CATEGORIES)[number], string> = { poise:'Poise', voice:'Voice', life:'Life', eyeContact:'Eye Contact', gestures:'Gestures', speed:'Speed' };
export const RATING_PERCENT: Record<PvlegsRating,number> = { 1:50, 2:75, 3:100 };

export interface PeerReviewRosterStudent { id:string; name:string }
export interface PeerReviewActivityData { activity:PeerReviewActivity; roster:PeerReviewRosterStudent[]; reviews:PresentationPeerReview[]; writtenCount:number; feedbackUnlocked:boolean; isTeacher:boolean }

export const scoreReview = (review: Pick<PresentationPeerReview,(typeof PVLEGS_CATEGORIES)[number]>) => Math.round(PVLEGS_CATEGORIES.reduce((sum,key)=>sum+RATING_PERCENT[review[key]],0)/PVLEGS_CATEGORIES.length);
export async function listPeerReviewActivities(classId:string){return executeLearningContent<{activities:PeerReviewActivity[]}>({action:'listPeerReviewActivities',classId});}
export async function createPeerReviewActivity(classId:string,title:string,reviewsRequired=3){return executeLearningContent<{activity:PeerReviewActivity}>({action:'createPeerReviewActivity',classId,title,reviewsRequired});}
export async function readPeerReviewActivity(activityId:string){return executeLearningContent<PeerReviewActivityData>({action:'readPeerReviewActivity',activityId});}
export async function setPeerReviewActivityStatus(activityId:string,status:'active'|'closed'){return executeLearningContent({action:'setPeerReviewActivityStatus',activityId,status});}
export async function submitPresentationPeerReview(payload:{activityId:string;presenterId:string;ratings:Record<string,PvlegsRating>;strengthComment:string;nextStepComment:string}){return executeLearningContent({action:'submitPresentationPeerReview',...payload});}
export async function flagPresentationPeerReview(reviewId:string,reason:string){return executeLearningContent({action:'flagPresentationPeerReview',reviewId,reason});}
export async function moderatePresentationPeerReview(payload:{reviewId:string;command:'update'|'hide'|'show'|'delete';ratings?:Record<string,PvlegsRating>;strengthComment?:string;nextStepComment?:string}){return executeLearningContent({action:'moderatePresentationPeerReview',...payload});}
