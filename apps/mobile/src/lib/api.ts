import AsyncStorage from '@react-native-async-storage/async-storage';
const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error { status: number; data: any; constructor(m: string, s: number, d: any) { super(m); this.status = s; this.data = d; } }

export async function api<T = any>(path: string, body?: any, method?: string): Promise<T> {
  const token = await AsyncStorage.getItem('token');
  let res: Response;
  try {
    res = await fetch(BASE + path, { method: method || (body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  } catch { throw new ApiError('Network unavailable', 0, {}); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Request failed', res.status, data);
  return data;
}
export const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); });
