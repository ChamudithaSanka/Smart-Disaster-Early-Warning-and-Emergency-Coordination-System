import { ReactNode } from 'react';
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => <div className={`card ${className}`}>{children}</div>;
export const CardTitle = ({ children }: { children: ReactNode }) => <div className="card-title">{children}</div>;

const SEV: Record<string, string> = { HIGH: 'bg-red-100 text-red-600', MEDIUM: 'bg-amber-100 text-amber-700', LOW: 'bg-green-100 text-green-700', MED: 'bg-amber-100 text-amber-700' };
export const Pill = ({ level, label }: { level: string; label?: string }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEV[level] || 'bg-slate-100 text-slate-600'}`}>{label || level[0] + level.slice(1).toLowerCase()}</span>
);
export const sevLabel = (s: string) => ({ HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' } as any)[s] || s;
export const levelName = (s: string) => ({ LOW: 'Level 1 Yellow', MEDIUM: 'Level 2 Amber', HIGH: 'Level 3 Red' } as any)[s];
export const fmtDate = (d: string | Date) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
export const fmtTime = (d: string | Date) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
export const Err = ({ msg }: { msg?: string }) => msg ? <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div> : null;
export const Soon = ({ title }: { title: string }) => <div><h1 className="text-2xl font-bold mb-4">{title}</h1><Card><p className="text-slate-500 text-sm">This screen was not part of the provided wireframes, so it is a placeholder.</p></Card></div>;
