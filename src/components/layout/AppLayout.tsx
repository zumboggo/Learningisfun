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
  const { user, logout } = useAuth();
  const location = useLocation();
  const syncState = useSyncStatus();
  const online = useOnlineStatus();

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const navItems = isTeacher
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/classes', label: 'Classes', icon: '👥' },
        { to: '/readings', label: 'Readings', icon: '📖' },
        { to: '/decks', label: 'Decks', icon: '🃏' },
      ]
    : [
        { to: '/dashboard', label: 'Home', icon: '🏠' },
        { to: '/readings', label: 'Readings', icon: '📖' },
        { to: '/decks', label: 'Cards', icon: '🃏' },
        { to: '/classes', label: 'Classes', icon: '👥' },
      ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link to="/dashboard" className="text-lg font-bold text-blue-700">
          Learning is Fun
        </Link>
        <div className="flex items-center gap-3">
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
              className={`flex flex-col items-center py-2 px-3 min-w-[64px] ${
                location.pathname.startsWith(item.to)
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
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
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 text-xs text-gray-400">
          {user?.name} · {user?.role}
        </div>
      </nav>

      <div className="hidden md:block ml-56">
        {/* Spacer for desktop nav */}
      </div>
    </div>
  );
}
