import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';

export interface User { id: string; name: string; email: string; role: string }
const Ctx = createContext<{ user: User | null; loading: boolean; login: (e: string, p: string) => Promise<User>; logout: () => void }>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!localStorage.getItem('token')) return setLoading(false);
    api('/auth/me').then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);
  const login = async (email: string, password: string) => {
    const r = await api('/auth/login', { body: { email, password } });
    localStorage.setItem('token', r.token); setUser(r.user); return r.user as User;
  };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export const homeFor = (role: string) => role === 'DMC_OFFICER' ? '/dmc/dashboard' : role === 'OPERATIONS_COORDINATOR' ? '/ops/requests' : '/login';
