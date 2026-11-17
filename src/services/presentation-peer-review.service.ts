import { executeLearningContent } from '@/services/learning-content.service';
import type { PeerReviewActivity, PresentationPeerReview, PvlegsRating, PeerRubric } from '@/types';

export const PVLEGS_CATEGORIES = ['poise','voice','life','eyeContact','gestures','speed'] as const;
export const PVLEGS_LABELS: Record<(typeof PVLEGS_CATEGORIES)[number], string> = { poise:'Poise', voice:'Voice', life:'Life', eyeContact:'Eye Contact', gestures:'Gestures', speed:'Speed' };
export const RATING_PERCENT: Record<PvlegsRating,number> = { 1:50, 2:75, 3:100 };

export interface PeerReviewRosterStudent { id:string; name:string }
export interface PeerReviewActivityData { activity:PeerReviewActivity; roster:PeerReviewRosterStudent[]; reviews:PresentationPeerReview[]; writtenCount:number; feedbackUnlocked:boolean; isTeacher:boolean }

const descriptions:Record<string,string>={poise:'Prepared, composed, and confident',voice:'Clear, expressive, and easy to hear',life:'Energy, interest, and expression',eyeContact:'Natural connection with the audience',gestures:'Movement that supports meaning',speed:'Comfortable pace and purposeful pauses'};
export function activityRubric(activity:{rubricJson?:string}):PeerRubric {
  if(activity.rubricJson)return JSON.parse(activity.rubricJson);
  return {name:'PVLEGS',columns:['Below expectations','Meeting expectations','Exceeding expectations'],rows:PVLEGS_CATEGORIES.map(id=>({id,label:PVLEGS_LABELS[id],description:descriptions[id],points:[50,75,100]}))};
}
export function reviewRatings(review:Partial<PresentationPeerReview>):Record<string,number> {
  return review.ratingsJson?JSON.parse(review.ratingsJson):Object.fromEntries(PVLEGS_CATEGORIES.map(key=>[key,review[key]!]));
}
export function scoreReview(review:Partial<PresentationPeerReview>,rubric=activityRubric({})) {
  const ratings=reviewRatings(review),max=rubric.rows.reduce((sum,row)=>sum+Math.max(...row.points),0);
  return Math.round(100*rubric.rows.reduce((sum,row)=>sum+(row.points[ratings[row.id]-1]??0),0)/max);
}
export async function listPeerReviewActivities(classId:string){return executeLearningContent<{activities:PeerReviewActivity[]}>({action:'listPeerReviewActivities',classId});}
export async function createPeerReviewActivity(classId:string,title:string,reviewsRequired=3,rubric?:PeerRubric){return executeLearningContent<{activity:PeerReviewActivity}>({action:'createPeerReviewActivity',classId,title,reviewsRequired,rubric});}
export async function readPeerReviewActivity(activityId:string){return executeLearningContent<PeerReviewActivityData>({action:'readPeerReviewActivity',activityId});}
export async function setPeerReviewActivityStatus(activityId:string,status:'active'|'closed'){return executeLearningContent({action:'setPeerReviewActivityStatus',activityId,status});}
export async function submitPresentationPeerReview(payload:{activityId:string;presenterId:string;ratings:Record<string,number>;strengthComment:string;nextStepComment:string}){return executeLearningContent({action:'submitPresentationPeerReview',...payload});}
export async function flagPresentationPeerReview(reviewId:string,reason:string){return executeLearningContent({action:'flagPresentationPeerReview',reviewId,reason});}
export async function moderatePresentationPeerReview(payload:{reviewId:string;command:'update'|'hide'|'show'|'delete';ratings?:Record<string,number>;strengthComment?:string;nextStepComment?:string}){return executeLearningContent({action:'moderatePresentationPeerReview',...payload});}
