import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateDeviceId(): string {
  const stored = localStorage.getItem('edu_spark_device_id');
  if (stored) return stored;
  const id = uuidv4();
  localStorage.setItem('edu_spark_device_id', id);
  return id;
}

export function getTimestamp(): string {
  return new Date().toISOString();
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
