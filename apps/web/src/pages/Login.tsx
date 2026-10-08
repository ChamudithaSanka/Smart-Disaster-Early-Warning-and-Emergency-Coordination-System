import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeFor, useAuth } from '../lib/auth';
import { Err } from '../components/ui';

const DEMO = [['DMC Officer', 'dmc@demo.lk'], ['EOC Coordinator', 'district@demo.lk'], ['Org Coordinator', 'org@demo.lk']];
export default function Login() {
  const { login } = useAuth(); const nav = useNavigate();
  const [email, setEmail] = useState('dmc@demo.lk'); const [password, setPassword] = useState('Password123!');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const u = await login(email, password); nav(homeFor(u.role)); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-4">
      <form onSubmit={submit} className="card w-full max-w-sm">
        <div className="mb-5 flex items-center gap-3"><div className="rounded bg-navy px-3 py-1 text-xs font-extrabold tracking-wider text-white">DMC</div><div className="font-bold">Disaster Warning System</div></div>
        <Err msg={err} />
        <label className="lbl">Email</label><input className="inp mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="lbl">Password</label><input type="password" className="inp mb-4" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy} className="btn-teal w-full">{busy ? 'Signing in…' : 'Sign in'}</button>
        <div className="mt-4 flex flex-wrap gap-2">{DEMO.map(([n, m]) => <button type="button" key={m} onClick={() => setEmail(m)} className="rounded-full border border-slate-300 px-3 py-1 text-xs">{n}</button>)}</div>
      </form>
    </div>
  );
}
