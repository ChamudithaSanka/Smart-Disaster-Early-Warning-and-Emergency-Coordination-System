import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function UserMenu({ label, links = [] }: { label: string; links?: { text: string; to: string }[] }) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth(); const nav = useNavigate();
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white">{label} ▾</button>
      {open && (
        <div className="absolute right-0 top-10 z-[1000] w-52 rounded-lg bg-white py-1 text-sm text-ink shadow-lg">
          {links.map((l) => <button key={l.to} onClick={() => { setOpen(false); nav(l.to); }} className="block w-full px-4 py-2 text-left hover:bg-slate-50">{l.text}</button>)}
          <button onClick={() => { logout(); nav('/login'); }} className="block w-full px-4 py-2 text-left text-red-600 hover:bg-slate-50">Logout</button>
        </div>
      )}
    </div>
  );
}
