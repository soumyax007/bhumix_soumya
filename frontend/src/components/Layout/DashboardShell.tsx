import Sidebar from './Sidebar';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface DashboardShellProps {
  role: 'field_officer' | 'tehsildar' | 'super_admin';
  userName: string;
  navItems: NavItem[];
  title: string;
  children: React.ReactNode;
}

export default function DashboardShell({ role, userName, navItems, title, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} userName={userName} navItems={navItems} />
      <main className="flex-1 bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-8 py-5">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
