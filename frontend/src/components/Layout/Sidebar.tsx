import { NavLink, Link } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  role: 'field_officer' | 'tehsildar' | 'super_admin';
  userName: string;
  navItems: NavItem[];
}

const ROLE_THEME = {
  field_officer: {
    accent: 'bg-fo-accent-600',
    active: 'bg-fo-accent-600/20 text-fo-accent-400 border-l-fo-accent-400',
    hover: 'hover:bg-fo-accent-600/10 hover:text-fo-accent-300',
    label: 'Field Officer',
  },
  tehsildar: {
    accent: 'bg-teh-accent-600',
    active: 'bg-teh-accent-600/20 text-teh-accent-400 border-l-teh-accent-400',
    hover: 'hover:bg-teh-accent-600/10 hover:text-teh-accent-300',
    label: 'Tehsildar',
  },
  super_admin: {
    accent: 'bg-sa-accent-600',
    active: 'bg-sa-accent-600/20 text-sa-accent-400 border-l-sa-accent-400',
    hover: 'hover:bg-sa-accent-600/10 hover:text-sa-accent-300',
    label: 'Super Admin',
  },
} as const;

export default function Sidebar({ role, userName, navItems }: SidebarProps) {
  const theme = ROLE_THEME[role];

  return (
    <aside className="w-64 bg-sidebar-dark min-h-screen flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3">
          <div className={`w-9 h-9 ${theme.accent} rounded-lg flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Bhumix</h1>
            <p className="text-slate-400 text-xs">{theme.label}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-2 ${
                isActive
                  ? theme.active
                  : `text-slate-400 border-l-transparent ${theme.hover}`
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${theme.accent} rounded-full flex items-center justify-center`}>
            <span className="text-white text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className="text-slate-500 text-xs">{theme.label}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
