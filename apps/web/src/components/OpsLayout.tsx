import { createContext, useContext, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Check, List, Map, Mail, Users, Send, Settings, Waves, Package } from 'lucide-react';
import UserMenu from './UserMenu';
import { api } from '../lib/api';

type NavItem = [any, string, string];
const REVIEW: NavItem[] = [[Waves, 'Hazard events', '/ops/events'], [AlertTriangle, 'Warnings', '/dmc/warnings'], [Check, 'Review queue', '/ops/review'], [List, 'Reports', '/dmc/delivery'], [Map, 'Map', '/ops/map']];
const RESCUE: NavItem[] = [[LayoutDashboard, 'Dashboard', '/ops/dashboard'], [Mail, 'Requests', '/ops/requests'], [Check, 'Approvals', '/ops/approvals'], [Users, 'Teams', '/ops/teams'], [Map, 'Map', '/ops/map'], [Send, 'Dispatch', '/ops/dispatch'], [Package, 'Relief', '/ops/relief'], [Settings, 'Settings', '/ops/settings']];
const ORG: NavItem[] = [[Package, 'Relief distribution', '/org/relief'], [LayoutDashboard, 'Centres', '/org/centres']];

const EventCtx = createContext<string>('');
export const useEventId = () => useContext(EventCtx);

export default function OpsLayout({ mode }: { mode: 'review' | 'rescue' | 'org' }) {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState('');
  const loc = useLocation();
  useEffect(() => { if (mode === 'review') api('/events').then((e) => { setEvents(e); setEventId(e[0]?.id || ''); }); }, [mode]);
  const nav = mode === 'review' ? REVIEW : mode === 'org' ? ORG : RESCUE;
  const title = mode === 'review' ? 'DMC hazard-monitoring dashboard — Emergency Operations Centre, Colombo' : 'DMC Operations Coordinator — Rescue, Dispatch, Approvals & Relief';
  return (
    <EventCtx.Provider value={eventId}>
      <div className="min-h-screen bg-page">
        <header className="flex h-[66px] items-center justify-between bg-navy px-6">
          <div className="text-[14px] font-bold text-white">{title}</div>
          <div className="flex items-center gap-4">
            {mode === 'review' && (
              <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="rounded-lg border-0 bg-white px-3 py-2 text-xs font-semibold text-ink">
                {events.map((e) => <option key={e.id} value={e.id}>Hazard event: {e.name}</option>)}
              </select>
            )}
            {mode === 'review' ? <span className="text-xs text-white/60">S. Jayasinghe · night shift</span> : null}
            <UserMenu label={mode === 'review' ? 'DMC Officer' : 'Operations Coordinator'} links={mode === 'review' ? [{ text: 'Warning console', to: '/dmc/dashboard' }] : []} />
          </div>
        </header>
        <div className="flex">
          <aside className="min-h-[calc(100vh-66px)] w-[170px] shrink-0 border-r border-slate-200 bg-white p-3">
            <div className="space-y-1">
              {nav.map(([Icon, text, to]) => {
                const active = loc.pathname.startsWith(to);
                return (
                  <NavLink key={text} to={to} className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-[13px] ${active ? 'border-teal bg-teal-soft font-semibold text-teal' : 'border-transparent text-slate-700 hover:bg-slate-50'}`}>
                    <Icon size={15} />{text}
                  </NavLink>
                );
              })}
            </div>
          </aside>
          <main className="min-w-0 flex-1 p-6"><Outlet /></main>
        </div>
      </div>
    </EventCtx.Provider>
  );
}
