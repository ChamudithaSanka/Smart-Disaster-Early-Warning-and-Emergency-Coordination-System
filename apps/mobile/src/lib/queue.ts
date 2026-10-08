import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from './api';

// Offline queue: items keep their client UUID + capture time, are synced in original order,
// and are removed ONLY after the server accepted them (server is idempotent on clientId).
export interface QItem { clientId: string; path: string; body: any; capturedAt: string }
const KEY = 'offline-queue';
export const getQueue = async (): Promise<QItem[]> => JSON.parse((await AsyncStorage.getItem(KEY)) || '[]');
export async function enqueue(item: QItem) { const q = await getQueue(); q.push(item); await AsyncStorage.setItem(KEY, JSON.stringify(q)); }

export async function flushQueue(): Promise<{ synced: number; conflicts: number }> {
  let q = await getQueue(); let synced = 0, conflicts = 0;
  while (q.length) {
    const it = q[0];
    try { await api(it.path, it.body); synced++; }
    catch (e) {
      if (e instanceof ApiError && e.status === 0) break;          // still offline: keep order, retry later
      if (e instanceof ApiError && (e.data?.conflict)) conflicts++; // server flagged for review: drop from queue
      else if (e instanceof ApiError && e.status >= 500) break;
    }
    q = q.slice(1); await AsyncStorage.setItem(KEY, JSON.stringify(q));
  }
  return { synced, conflicts };
}
