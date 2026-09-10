import { useNavigate } from 'react-router-dom';
import { useUserIdentity, ROLE_DISPLAY } from '../hooks/useUserIdentity';
import type { UserRole } from '../hooks/useUserIdentity';

const ROLES: { value: UserRole; desc: string; accent: string; hoverBorder: string; iconBg: string; iconColor: string; path: string }[] = [
  {
    value: 'field_officer',
    desc: 'Upload, scan & translate land documents. Submit records for approval.',
    accent: 'hover:shadow-fo-accent-500/20',
    hoverBorder: 'hover:border-fo-accent-400',
    iconBg: 'bg-fo-accent-500',
    iconColor: 'text-white',
    path: '/field-officer',
  },
  {
    value: 'tehsildar',
    desc: 'Review pending submissions. Approve or reject land records.',
    accent: 'hover:shadow-teh-accent-500/20',
    hoverBorder: 'hover:border-teh-accent-400',
    iconBg: 'bg-teh-accent-500',
    iconColor: 'text-white',
    path: '/tehsildar',
  },
  {
    value: 'super_admin',
    desc: 'Search & view all approved land records across the system.',
    accent: 'hover:shadow-sa-accent-500/20',
    hoverBorder: 'hover:border-sa-accent-400',
    iconBg: 'bg-sa-accent-500',
    iconColor: 'text-white',
    path: '/super-admin',
  },
];

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  field_officer: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  tehsildar: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  super_admin: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

export default function Home() {
  const navigate = useNavigate();
  const { login, isIdentified, role, logout } = useUserIdentity();

  // If already logged in, show quick-resume
  if (isIdentified && role) {
    const current = ROLES.find((r) => r.value === role);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Bhumix</h1>
          <p className="text-slate-400 text-sm mb-8">Land Record Digitization & Verification</p>
          <button
            onClick={() => navigate(current?.path || '/')}
            className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 text-left hover:border-white/40 transition mb-4"
          >
            <p className="text-white font-semibold text-lg">{ROLE_DISPLAY[role]} Dashboard</p>
            <p className="text-slate-400 text-sm mt-1">Continue to your dashboard →</p>
          </button>
          <button
            onClick={() => { logout(); }}
            className="text-slate-500 text-sm hover:text-slate-300 transition"
          >
            Switch role
          </button>
        </div>
      </div>
    );
  }

  // One-tap role selection — no name input
  const handleRoleSelect = (r: typeof ROLES[number]) => {
    login(r.value);
    navigate(r.path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-3">Bhumix</h1>
          <p className="text-slate-400 text-lg">Land Record Digitization & Verification System</p>
        </div>

        <p className="text-slate-300 text-sm font-medium mb-4 text-center">Select your role to continue</p>

        <div className="space-y-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => handleRoleSelect(r)}
              className={`w-full text-left bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 transition-all ${r.hoverBorder} ${r.accent} hover:shadow-lg hover:bg-white/10 flex items-center gap-4`}
            >
              <div className={`w-12 h-12 ${r.iconBg} rounded-lg flex items-center justify-center shrink-0 ${r.iconColor}`}>
                {ROLE_ICONS[r.value]}
              </div>
              <div>
                <p className="text-white font-semibold text-lg">{ROLE_DISPLAY[r.value]}</p>
                <p className="text-slate-400 text-sm mt-0.5">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-slate-600 text-xs mt-8 text-center">
          SIH 26018 — Land Record Digitization and Validation System
        </p>
      </div>
    </div>
  );
}
