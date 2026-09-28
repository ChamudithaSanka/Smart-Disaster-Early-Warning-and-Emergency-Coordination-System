const BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:4000/api';

export async function api<T = any>(path: string, opts: { method?: string; body?: any } = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}
