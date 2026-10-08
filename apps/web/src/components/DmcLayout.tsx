import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Plus, CircleDot, Bell, List, Users, Settings, LogOut } from 'lucide-react';
import UserMenu from './UserMenu';
import { useAuth } from '../lib/auth';

const top = [['DASHBOARD', '/dmc/dashboard'], ['WARNINGS', '/dmc/warnings'], ['CREATE WARNING', '/dmc/create'], ['AREAS', '/dmc/areas'], ['REPORTS', '/dmc/delivery'], ['CITIZENS', '/dmc/citizens'], ['SETTINGS', '/dmc/settings']];
const side = [[LayoutDashboard, 'Dashboard', '/dmc/dashboard'], [AlertTriangle, 'Warnings', '/dmc/warnings'], [Plus, 'Create Warning', '/dmc/create'], [CircleDot, 'Areas', '/dmc/areas'], [Bell, 'Notifications', '/dmc/notifications'], [List, 'Delivery Reports', '/dmc/delivery'], [Users, 'Citizens', '/dmc/citizens'], [Settings, 'Settings', '/dmc/settings']] as const;

export default function DmcLayout() {
  const { logout } = useAuth(); const nav = useNavigate();
  return (
    <div className="min-h-screen bg-page">
      <header className="flex h-[54px] items-center bg-navy px-5">
        <div className="mr-6 rounded bg-white px-3 py-1 text-xs font-extrabold tracking-wider text-navy">DMC</div>
        <nav className="flex flex-1 gap-5 self-stretch">
          {top.map(([t, to]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center border-b-2 text-[11px] font-bold tracking-wide ${isActive ? 'border-orange text-white' : 'border-transparent text-white/80 hover:text-white'}`}>{t}</NavLink>
          ))}
        </nav>
        <UserMenu label="DMC Officer" links={[{ text: 'Hazard report review queue', to: '/ops/review' }]} />
      </header>
      <div className="flex">
        <aside className="sticky top-0 flex min-h-[calc(100vh-54px)] w-[190px] shrink-0 flex-col border-r border-slate-200 bg-white p-3">
          <div className="flex-1 space-y-1">
            {side.map(([Icon, text, to]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-[13px] ${isActive ? 'border-teal bg-teal-soft font-semibold text-teal' : 'border-transparent text-slate-700 hover:bg-slate-50'}`}>
                <Icon size={15} />{text}
              </NavLink>
            ))}
          </div>
          <button onClick={() => { logout(); nav('/login'); }} className="flex items-center justify-center gap-2 rounded-lg bg-[#d12b2b] py-3 text-sm font-semibold text-white shadow"><LogOut size={14} />Logout</button>
        </aside>
        <main className="min-w-0 flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  );
}
