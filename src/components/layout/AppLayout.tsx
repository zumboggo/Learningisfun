import {WORKSHOP_CLASS_ID,isWorkshopPath} from '@/services/workshop-context';
import {GameDisplay} from '@/components/GameDisplay';
import {isGamePlayerRoute} from '@/services/game-display';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { SyncIndicator } from './SyncIndicator';
import { isRememberablePage, lastPageKey } from '@/utils/last-page';

interface AppLayoutProps {
  children: ReactNode;
}

const planningViews = [
  { label: 'Brainstorming boards', to: '/brainstorming' },
  { label: 'Weekly Lesson Plans', to: '/planner' },
];
const settingsViews = [
  { label: 'Settings', to: '/settings' },
  { label: 'Data', to: '/data' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, isTeacher, isParent, viewAsStudent, setViewAsStudent,workshopMode,workshopAccess,workshopError } = useAuth();
  const location = useLocation();
  const syncState = useSyncStatus(user?.$id);
  const online = useOnlineStatus();
  const [planningViewsOpen, setPlanningViewsOpen] = useState(true);
  const planningToggleLabel = planningViewsOpen ? 'Hide planning views' : 'Show planning views';
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('teacher-sidebar-collapsed') !== 'true';
    } catch {
      return true;
    }
  });
  const toggleSidebar = () => {
    const nextOpen = !sidebarOpen;
    setSidebarOpen(nextOpen);
    try {
      localStorage.setItem('teacher-sidebar-collapsed', String(!nextOpen));
    } catch {
      // Keep the toggle usable when browser storage is unavailable.
    }
  };
  const isArticleRoute = /^\/texts\/[^/]+(?:\/present)?$/.test(location.pathname) || location.pathname.startsWith('/discussions/texts/');
  const isStudyRoute = /\/decks\/[^/]+\/review$/.test(location.pathname);

  const isGameRoute=isGamePlayerRoute(location.pathname);
  const content=isGameRoute&&user?<GameDisplay key={user.$id+location.pathname} userId={user.$id}>{children}</GameDisplay>:children;
  const path = location.pathname.replace(/\/$/, '');
  const inPlanning = path === '/brainstorming' || path === '/planning' || path === '/planner' || path.startsWith('/planner/');
  const inSettings = ['/settings', '/data', '/teacher-access'].includes(path);
  const sectionViews = inPlanning ? planningViews : inSettings ? settingsViews : [];
  const activeView = inPlanning
    ? (path === '/brainstorming' ? '/brainstorming' : '/planner')
    : (path === '/data' ? '/data' : '/settings');

  const navActive=(to:string)=>{
    if (isTeacher && location.pathname.startsWith('/discussions')) return to === '/texts';
    if (isTeacher && inPlanning) return to === '/brainstorming';
    if (isTeacher && inSettings) return to === '/settings';
    return to==='/game'?(location.pathname==='/game'||isGameRoute||/\/classes\/[^/]+\/game$/.test(location.pathname)):to==='/classes'?location.pathname.startsWith(to)&&!isGameRoute&&!/\/game$/.test(location.pathname):location.pathname.startsWith(to);
  };
  const isActualTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    if (!user || !isRememberablePage(location.pathname)) return;
    localStorage.setItem(lastPageKey(user.$id), `${location.pathname}${location.search}`);
  }, [location.pathname, location.search, user]);

  const navItems = isTeacher
    ? [
        { to: '/classes', label: 'Classes', icon: 'C' },
        { to: '/brainstorming', label: 'Planning', icon: 'P' },
        { to: '/create', label: 'Create', icon: '+' },
        { to: '/decks', label: 'Cards', icon: 'V' },
        { to: '/texts', label: 'Texts', icon: 'T' },
        { to: '/lessons', label: 'Lessons', icon: 'L' },
        { to: '/writing', label: 'Writing', icon: 'W' },
        { to: '/game', label: 'The Game', icon: 'G' },
        { to: '/settings', label: 'Settings', icon: '?' },
      ]
    : isParent ? [
        { to: '/dashboard', label: 'Home', icon: 'home' },
        { to: '/classes', label: 'Classes', icon: 'classes' },
        { to: '/decks', label: 'Cards', icon: 'cards' },
        { to: '/texts', label: 'Texts', icon: 'read' },
      ] : [
        { to: '/dashboard', label: 'Home', icon: 'home' },
        { to: '/classes', label: 'Classes', icon: 'classes' },
        { to: '/decks', label: 'Cards', icon: 'cards' },
        { to: '/texts', label: 'Texts', icon: 'read' },
        { to: '/lessons', label: 'Lessons', icon: 'quiz' },
        { to: '/game', label: 'The Game', icon: 'game' },
        { to: '/brainstorming', label: 'Planner', icon: 'write' },
      ];

  if(workshopMode)return <div className="min-h-screen bg-white"><header className="flex flex-wrap items-center justify-between gap-3 border-b bg-teal-50 px-4 py-3"><div><strong>Lifeplus Workshop</strong><p className="text-sm">Participating as a learner · your teacher account stays active</p></div><nav className="flex gap-4"><Link to={`/classes/${WORKSHOP_CLASS_ID}`}>Workshop materials</Link><Link to="/classes">Return to teaching</Link></nav></header><main>{content}</main></div>;
  if(isActualTeacher&&isWorkshopPath(location.pathname,location.search)&&!workshopAccess?.owner&&!workshopAccess?.enrolled&&location.pathname!=='/workshop')return <main className="mx-auto max-w-lg space-y-4 p-6"><p>{workshopError||'Join Lifeplus Workshop before opening its materials.'}</p><Link to="/workshop">Join workshop</Link><Link className="ml-4" to="/classes">Return to teaching</Link></main>;
  if (!isTeacher) {
    return (
      <div className={`student-shell min-h-screen ${location.pathname==='/lessons'?'lessons-layout':''}`}>
        {/* Account controls sit in the page flow rather than floating over the
            hero, so nothing overlaps on narrow screens. */}
        <div data-app-chrome className={`${isStudyRoute ? 'hidden' : 'flex'} mx-auto w-full max-w-[46rem] items-center justify-end gap-3 px-[clamp(1rem,4vw,1.5rem)] pt-3`}>
          {isActualTeacher && (
            <button
              onClick={() => setViewAsStudent(!viewAsStudent)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewAsStudent
                  ? 'border-blue-200 bg-blue-100 text-blue-700'
                  : 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={viewAsStudent ? 'Viewing as student' : 'Viewing as teacher'}
            >
              {viewAsStudent ? 'Student' : 'Teacher'}
            </button>
          )}
          <SyncIndicator {...syncState} online={online} friendly />
          <button
            onClick={() => void logout()}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Sign out
          </button>
        </div>

        <main className={`student-main ${isArticleRoute ? 'student-main-article' : ''} ${isStudyRoute ? 'student-main-study' : ''}`}>
          {content}
        </main>

        <nav data-app-chrome className="student-floating-nav safe-area-bottom">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={navActive(item.to)?'page':undefined}
              className={`student-floating-nav-item ${
                navActive(item.to)
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
    <div className={`min-h-screen bg-gray-50 flex flex-col ${sidebarOpen ? 'md:pl-56' : ''}`}>
      <header data-app-chrome className="min-h-16 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
            aria-controls="teacher-sidebar"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            className="hidden md:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
              <path d={sidebarOpen ? 'm15 9-3 3 3 3' : 'm13 9 3 3-3 3'} />
            </svg>
          </button>
          <Link to="/classes" className="text-lg font-bold text-blue-700">
            Learning is Fun
          </Link>
        </div>
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
          <SyncIndicator {...syncState} online={online} friendly />
          <button
            onClick={() => void logout()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-4">
        {sectionViews.length > 0 && (
          <nav id={inPlanning ? 'planning-views' : undefined} hidden={inPlanning && !planningViewsOpen} aria-label={inPlanning ? 'Planning views' : 'Settings views'} data-app-chrome
            className="mx-auto grid max-w-4xl grid-cols-2 gap-2 px-4 pt-4 [&[hidden]]:hidden print:hidden">
            {sectionViews.map(view => (
              <Link key={view.to} to={view.to} aria-current={view.to === activeView ? 'page' : undefined}
                className={`flex min-h-16 items-center justify-center rounded-xl border-2 px-3 py-3 text-center text-lg font-bold leading-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:text-xl ${
                  view.to === activeView
                    ? 'border-blue-700 bg-blue-700 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:bg-blue-50'
                }`}>
                {view.label}
              </Link>
            ))}
          </nav>
        )}
        {inPlanning && (
          <button type="button" data-app-chrome aria-controls="planning-views" aria-expanded={planningViewsOpen}
            aria-label={planningToggleLabel} title={planningToggleLabel}
            onClick={() => setPlanningViewsOpen(open => !open)}
            className="mx-auto my-1 flex h-8 w-14 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700 print:hidden">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-5">
              <path d={planningViewsOpen ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'}/>
            </svg>
          </button>
        )}
        {content}
      </main>

      <nav data-app-chrome className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-bottom">
        {/* Navigation tabs have to share a phone's width, so each is an equal-width
            column with a clipped label rather than a fixed minimum that wraps. */}
        <div className="grid grid-flow-col auto-cols-fr">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={navActive(item.to)?'page':undefined}
              className={`flex min-w-0 flex-col items-center px-0.5 py-2 ${
                navActive(item.to)
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-100 text-xs font-bold">
                {item.icon}
              </span>
              <span className="mt-1 max-w-full truncate text-[10px] leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <nav id="teacher-sidebar" aria-label="Teacher sidebar" data-app-chrome className={`${sidebarOpen ? 'hidden md:flex' : 'hidden'} fixed left-0 top-16 bottom-0 w-56 bg-white border-r border-gray-200 flex-col z-20`}>
        <div className="flex-1 py-4">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={navActive(item.to)?'page':undefined}
              className={`flex items-center gap-3 px-4 py-3 text-sm ${
                navActive(item.to)
                  ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-bold">
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
  if (name === 'game') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10c3 0 5 10 3 11-2 1-4-3-5-3H9c-1 0-3 4-5 3-2-1 0-11 3-11Z"/><path d="M7 9v5M4.5 11.5h5M16 10h.01M18 13h.01"/></svg>;
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
  if (name === 'classes') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V6l8-3 8 3v14"/><path d="M8 9h2M14 9h2M8 13h2M14 13h2M10 20v-3h4v3"/></svg>;
  }
  if (name === 'write') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 20h14" />
        <path d="M15.5 4.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
        <path d="M13.5 6.5l3 3" />
      </svg>
    );
  }
  if (name === 'quiz') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 7h6" />
        <path d="M9 11h6" />
        <path d="M9 15h3" />
        <circle cx="15" cy="16" r="2.5" />
        <path d="M15 14.5v1.5l1 1" />
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
