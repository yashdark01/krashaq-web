'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Bell,
  BookOpen,
  CloudSun,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sprout,
  Store,
  ScrollText,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { anonymous } from '@/features/auth/auth.slice';
import { setLocale } from '@/features/ui/ui.slice';
import { api } from '@/lib/api/platform.api';
import { mutate } from '@/lib/api/http-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const navigation = [
  ['/krashaq-ai', 'Krashaq AI', MessageCircle],
  ['/farming-intelligence', 'Farming Intelligence', Sprout],
  ['/knowledge', 'Knowledge', BookOpen],
  ['/farms', 'My farms', MapPin],
  ['/reference-records', 'Schemes', ScrollText],
  ['/alerts', 'Alerts', Bell],
] as const;

/** Reusable private application frame. Logout clears client cache but never handles token values. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useAppSelector((state) => state.ui.locale);
  const role = useAppSelector((state) => state.auth.identity?.role);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const initial = useAppSelector(
    (state) => state.auth.identity?.sub?.slice(0, 1).toUpperCase() ?? 'K',
  );
  async function logout() {
    try {
      await mutate('auth/logout');
    } finally {
      dispatch(anonymous());
      dispatch(api.util.resetApiState());
      router.replace('/sign-in');
      router.refresh();
    }
  }
  function closeMobileNav() {
    setMobileOpen(false);
  }

  return (
    <div className={`shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={closeMobileNav} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/dashboard" className="brand" onClick={closeMobileNav}>
            <span><Sprout size={22} /></span>
            krashaq<span className="brand-dot">.</span>
          </Link>
          <Button variant="ghost" className="mobile-close" onClick={closeMobileNav} aria-label="Close navigation">
            <X />
          </Button>
          <Button variant="ghost" className="sidebar-collapse-toggle" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={sidebarCollapsed}>
            {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>
        <div className="workspace-card">
          <div className="workspace-icon"><Sprout /></div>
          <div><strong>Farm workspace</strong><span>Personal dashboard</span></div>
          <span className="workspace-status" aria-label="Workspace synced" />
        </div>
        <p className="workspace-label">YOUR FARM WORKSPACE</p>
        <nav aria-label="Primary navigation">
          {navigation.map(([href, label, Icon]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link className={active ? 'active' : ''} key={href} href={href} onClick={closeMobileNav} aria-current={active ? 'page' : undefined}>
                <Icon />
                <span>{label}</span>
                {label === 'Alerts' && <span className="nav-count">3</span>}
              </Link>
            );
          })}
          {role === 'admin' && (
            <div className="nav-admin-group">
              <p className="workspace-label">ADMINISTRATION</p>
              <Link className={pathname === '/admin/users' ? 'active' : ''} href="/admin/users" onClick={closeMobileNav}><ShieldCheck /><span>Administration</span></Link>
              <Link className={pathname === '/admin/knowledge' ? 'active' : ''} href="/admin/knowledge" onClick={closeMobileNav}><BookOpen /><span>Knowledge library</span></Link>
            </div>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><span>FIELD NOTE</span><strong>Small steps make stronger farms.</strong></div>
          <Link href="/settings" onClick={closeMobileNav}><Settings /><span>Settings</span></Link>
          <Button variant="ghost" onClick={() => void logout()}><LogOut /><span>Sign out</span></Button>
          <div className="small-brand">GROWING BETTER, TOGETHER.</div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <Button variant="ghost" className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></Button>
          <div className="topbar-context">
            <span className="topbar-kicker">FARM INTELLIGENCE <span className="top-dot">/</span> YOUR DAILY PERSPECTIVE</span>
            <Link href="/dashboard" className={`topbar-overview${pathname === '/dashboard' ? ' active' : ''}`} aria-current={pathname === '/dashboard' ? 'page' : undefined}>
              <LayoutDashboard /> <span>Overview</span>
            </Link>
            <nav className="topbar-links" aria-label="Quick navigation">
              <Link href="/weather" className={pathname.startsWith('/weather') ? 'active' : ''} aria-current={pathname.startsWith('/weather') ? 'page' : undefined}><CloudSun /> <span>Weather</span></Link>
              <Link href="/markets" className={pathname.startsWith('/markets') ? 'active' : ''} aria-current={pathname.startsWith('/markets') ? 'page' : undefined}><Store /> <span>Markets</span></Link>
            </nav>
          </div>
          <div>
            <button className="locale" onClick={() => dispatch(setLocale(locale === 'en' ? 'hi' : 'en'))}>{locale === 'en' ? 'हिन्दी' : 'English'}</button>
            <Link href="/profile" className="avatar" aria-label="Open profile">{initial}</Link>
          </div>
        </header>
        <main id="main-content">
          {children}
          <footer>KRASHAQ AGRITECH <span>Rooted in knowledge. Growing with you.</span></footer>
        </main>
      </div>
    </div>
  );
}
