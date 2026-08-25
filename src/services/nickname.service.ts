import { db } from '@/db/schema';
import { executeLearningContent } from '@/services/learning-content.service';
import type { User } from '@/types';

export interface ClassNickname { userId: string; nickname: string; }
export interface NicknameReport {
  $id: string;
  classId: string;
  reporterId: string;
  targetUserId: string;
  nickname: string;
  reason: string;
  status: 'open' | 'dismissed' | 'resolved';
  createdAt: string;
  reporterName?: string;
  targetName?: string;
}

const STRONG_BLOCKS = ['fuck', 'shit', 'bitch', 'cunt', 'nigger', 'nigga', 'faggot', 'asshole', 'pornhub'];
const EXACT_BLOCKS = new Set(['porn', 'sex', 'dick', 'penis', 'vagina', 'whore', 'slut', 'retard', 'nazi', 'hitler', 'kkk', 'teacher', 'admin', 'administrator']);

function normalizedTokens(value: string): string[] {
  return value.normalize('NFKD').toLowerCase().replace(/[013457@$!]/g, character => ({ '0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','!':'i' }[character] || character)).split(/[^a-z]+/).filter(Boolean);
}

export function nicknameValidationError(value: string): string | null {
  const nickname = value.trim().replace(/\s+/g, ' ');
  if (nickname.length < 2 || nickname.length > 24) return 'Use between 2 and 24 characters.';
  if (!/^[\p{L}\p{N} ._'’-]+$/u.test(nickname)) return 'Use letters, numbers, spaces, periods, apostrophes, or hyphens only.';
  const tokens = normalizedTokens(nickname);
  const compact = tokens.join('');
  if (tokens.some(token => EXACT_BLOCKS.has(token)) || STRONG_BLOCKS.some(term => compact.includes(term))) return 'Please choose a school-appropriate nickname.';
  return null;
}

export function nextNicknameChangeAt(user: Pick<User, 'nicknameUpdatedAt'>): Date | null {
  if (!user.nicknameUpdatedAt) return null;
  const next = new Date(new Date(user.nicknameUpdatedAt).getTime() + 24 * 60 * 60 * 1000);
  return next.getTime() > Date.now() ? next : null;
}

export async function updateNickname(nickname: string): Promise<User> {
  const validation = nicknameValidationError(nickname);
  if (validation) throw new Error(validation);
  const result = await executeLearningContent<{ profile: User }>({ action: 'updateNickname', nickname: nickname.trim().replace(/\s+/g, ' ') });
  const existing = await db.users.get(result.profile.$id);
  const profile = { ...existing, ...result.profile } as User;
  await db.users.put(profile);
  return profile;
}

export async function readClassNicknames(classId: string): Promise<{ nicknames: ClassNickname[]; reports: NicknameReport[]; isTeacher: boolean }> {
  return executeLearningContent({ action: 'readClassNicknames', classId });
}

export async function reportNickname(classId: string, targetUserId: string, reason: string): Promise<void> {
  await executeLearningContent({ action: 'reportNickname', classId, targetUserId, reason: reason.trim() });
}

export async function moderateNicknameReport(reportId: string, command: 'dismiss' | 'reset'): Promise<void> {
  await executeLearningContent({ action: 'moderateNicknameReport', reportId, command });
}
