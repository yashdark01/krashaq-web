'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
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
  Sun,
  Moon,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { anonymous } from '@/features/auth/auth.slice';
import { setLocale } from '@/features/ui/ui.slice';
import { api } from '@/lib/api/platform.api';
import { mutate } from '@/lib/api/http-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useT } from '@/lib/i18n';

const navigation = [
  ['/krashaq-ai', 'Krashaq AI', 'कृषि AI', MessageCircle],
  ['/farming-intelligence', 'Farming Intelligence', 'कृषि बुद्धिमत्ता', Sprout],
  ['/farms', 'My farms', 'मेरे खेत', MapPin],
  ['/alerts', 'Alerts', 'अलर्ट', Bell],
] as const;

const shellCopy = {
  en: { overview: 'Overview', weather: 'Weather', markets: 'Markets', profile: 'Profile', language: 'हिन्दी', workspace: 'Farm workspace', settings: 'Settings', knowledge: 'Knowledge', schemes: 'Schemes', signOut: 'Sign out' },
  hi: { overview: 'अवलोकन', weather: 'मौसम', markets: 'बाज़ार', profile: 'प्रोफ़ाइल', language: 'English', workspace: 'कृषि कार्यक्षेत्र', settings: 'सेटिंग्स', knowledge: 'ज्ञान', schemes: 'योजनाएं', signOut: 'साइन आउट' },
} as const;

/** Reusable private application frame. Logout clears client cache but never handles token values. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useAppSelector((state) => state.ui.locale);
  const role = useAppSelector((state) => state.auth.identity?.role);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const activeTheme = theme === 'dark' ? 'dark' : 'light';
  const initial = useAppSelector(
    (state) => state.auth.identity?.sub?.slice(0, 1).toUpperCase() ?? 'K',
  );
  const copy = shellCopy[locale];
  const t = useT();

  useEffect(() => {
    document.documentElement.lang = locale === 'hi' ? 'hi-IN' : 'en-IN';
    document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [locale]);

  async function logout() {
    try {
      await mutate('auth/logout');
    } catch {
      // Continue local sign-out when the API or CSRF endpoint is unavailable.
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
        </div>
        <nav aria-label="Primary navigation">
          {navigation.map(([href, label, hindiLabel, Icon]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link className={active ? 'active' : ''} key={href} href={href} onClick={closeMobileNav} aria-current={active ? 'page' : undefined}>
                <Icon />
                <span>{locale === 'hi' ? hindiLabel : label}</span>
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
          <div className="sidebar-tip"><span>{t('FIELD NOTE')}</span><strong>{t('Small steps make stronger farms.')}</strong></div>
          <div className="small-brand">{t('GROWING BETTER, TOGETHER.')}</div>
          <div className="sidebar-profile profile-menu">
            <button className="profile-trigger" onClick={() => setProfileOpen((open) => !open)} aria-label="Open profile menu" aria-expanded={profileOpen}>
              <span className="avatar">{initial}</span><span className="profile-name">{copy.profile}</span>
            </button>
            {profileOpen && (
              <div className="profile-popover" role="menu">
                <div className="profile-popover-heading"><span className="avatar">{initial}</span><div><strong>{t('Your profile')}</strong><small>{t('Personal workspace')}</small></div></div>
                <Link href="/settings" role="menuitem" onClick={() => setProfileOpen(false)}><Settings /> {t('Settings')}</Link>
                <Link href="/knowledge" role="menuitem" onClick={() => setProfileOpen(false)}><BookOpen /> {t('Knowledge')}</Link>
                <Link href="/reference-records" role="menuitem" onClick={() => setProfileOpen(false)}><ScrollText /> {t('Schemes')}</Link>
                <button className="profile-menu-action" role="menuitem" onClick={() => { setProfileOpen(false); void logout(); }}><LogOut /> {t('Sign out')}</button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <Button variant="ghost" className="topbar-collapse-toggle" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={sidebarCollapsed}>
            {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <Button variant="ghost" className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></Button>
          <div className="topbar-context">
            <span className="topbar-kicker">{t('FARM INTELLIGENCE')} <span className="top-dot">/</span> {t('YOUR DAILY PERSPECTIVE')}</span>
            <nav className="topbar-links" aria-label="Quick navigation">
              <Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''} aria-current={pathname === '/dashboard' ? 'page' : undefined}><LayoutDashboard /> <span>{copy.overview}</span></Link>
              <Link href="/weather" className={pathname.startsWith('/weather') ? 'active' : ''} aria-current={pathname.startsWith('/weather') ? 'page' : undefined}><CloudSun /> <span>{copy.weather}</span></Link>
              <Link href="/markets" className={pathname.startsWith('/markets') ? 'active' : ''} aria-current={pathname.startsWith('/markets') ? 'page' : undefined}><Store /> <span>{copy.markets}</span></Link>
            </nav>
          </div>
          <div className="topbar-actions">
            <button className="theme-toggle" onClick={() => setTheme(activeTheme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${activeTheme === 'light' ? 'dark' : 'light'} theme`}>
              {activeTheme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              <span>{activeTheme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
            <button className="locale" onClick={() => dispatch(setLocale(locale === 'en' ? 'hi' : 'en'))} aria-label="Switch language">{copy.language}</button>
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
