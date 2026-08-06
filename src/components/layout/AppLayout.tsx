import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { SyncIndicator } from './SyncIndicator';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, isTeacher, viewAsStudent, setViewAsStudent } = useAuth();
  const location = useLocation();
  const syncState = useSyncStatus();
  const online = useOnlineStatus();

  const isActualTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const navItems = isTeacher
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: 'D' },
        { to: '/discussions', label: 'Discussions', icon: 'Q' },
        { to: '/decks', label: 'Decks', icon: 'V' },
        { to: '/classes', label: 'Classes', icon: 'C' },
        { to: '/settings', label: 'Settings', icon: '?' },
      ]
    : [
        { to: '/dashboard', label: 'Home', icon: 'home' },
        { to: '/decks', label: 'Flashcards', icon: 'cards' },
        { to: '/discussions', label: 'Discussions', icon: 'chat' },
      ];

  if (!isTeacher) {
    return (
      <div className="student-shell min-h-screen">
        <div className="fixed right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
          {isActualTeacher && (
            <button
              onClick={() => setViewAsStudent(!viewAsStudent)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                viewAsStudent
                  ? 'bg-blue-100 border-blue-200 text-blue-700'
                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
              }`}
              title={viewAsStudent ? 'Viewing as student' : 'Viewing as teacher'}
            >
              {viewAsStudent ? 'Student' : 'Teacher'}
            </button>
          )}
          <SyncIndicator {...syncState} online={online} />
          <button
            onClick={() => void logout()}
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Sign out
          </button>
        </div>

        <main className="pb-32">
          {children}
        </main>

        <nav className="student-floating-nav safe-area-bottom">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`student-floating-nav-item ${
                location.pathname.startsWith(item.to)
                  ? 'student-floating-nav-item-active'
                  : ''
              }`}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:pl-56">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link to="/dashboard" className="text-lg font-bold text-blue-700">
          Learning is Fun
        </Link>
        <div className="flex items-center gap-3">
          {isActualTeacher && (
            <button
              onClick={() => setViewAsStudent(!viewAsStudent)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                viewAsStudent
                  ? 'bg-blue-100 border-blue-200 text-blue-700'
                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
              }`}
              title={viewAsStudent ? 'Viewing as student' : 'Viewing as teacher'}
            >
              {viewAsStudent ? 'Student view' : 'Teacher view'}
            </button>
          )}
          <SyncIndicator {...syncState} online={online} />
          <button
            onClick={() => void logout()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-4">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-bottom">
        <div className="flex justify-around">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex min-w-[58px] flex-col items-center px-2 py-2 ${
                location.pathname.startsWith(item.to)
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-bold">
                {item.icon}
              </span>
              <span className="mt-1 text-[11px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <nav className="hidden md:flex fixed left-0 top-14 bottom-0 w-56 bg-white border-r border-gray-200 flex-col z-20">
        <div className="flex-1 py-4">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 text-sm ${
                location.pathname.startsWith(item.to)
                  ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-bold">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 text-xs text-gray-400">
          {user?.name} - {user?.role}
        </div>
      </nav>
    </div>
  );
}

function NavIcon({ name }: { name: string }) {
  if (name === 'home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.5V20h4.8v-5.4h3.4V20h4.8v-9.5" />
      </svg>
    );
  }
  if (name === 'cards') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="11" height="14" rx="2" />
        <path d="M9 3h8a2 2 0 0 1 2 2v11" />
        <path d="M7.5 10h4" />
        <path d="M7.5 14h3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6.5h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-7l-4.5 3v-3H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" />
      <path d="M8 11h.01" />
      <path d="M12 11h.01" />
      <path d="M16 11h.01" />
    </svg>
  );
}
