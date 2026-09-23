'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  BookOpen,
  CloudSun,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageCircle,
  Settings,
  Sprout,
  Store,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { anonymous } from '@/features/auth/auth.slice';
import { setLocale } from '@/features/ui/ui.slice';
import { api } from '@/lib/api/platform.api';
import { mutate } from '@/lib/api/http-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const navigation = [
  ['/dashboard', 'Overview', LayoutDashboard],
  ['/krashaq-ai', 'Krashaq AI', MessageCircle],
  ['/farming-intelligence', 'Farming Intelligence', Sprout],
  ['/knowledge', 'Knowledge', BookOpen],
  ['/farms', 'My farms', MapPin],
  ['/weather', 'Weather', CloudSun],
  ['/markets', 'Markets', Store],
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
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span>
            <Sprout size={23} />
          </span>
          krashaq<span className="brand-dot">.</span>
        </Link>
        <p className="workspace-label">YOUR FARM WORKSPACE</p>
        <nav>
          {navigation.map(([href, label, Icon]) => (
            <Link
              className={pathname.startsWith(href) ? 'active' : ''}
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? 'page' : undefined}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          {role === 'admin' && (
            <>
              <Link
                className={pathname === '/admin/users' ? 'active' : ''}
                href="/admin/users"
              >
                <ShieldCheck size={18} /> Administration
              </Link>
              <Link
                className={pathname === '/admin/knowledge' ? 'active' : ''}
                href="/admin/knowledge"
              >
                <BookOpen size={18} /> Knowledge library
              </Link>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/settings">
            <Settings size={18} /> Settings
          </Link>
          <Button variant="ghost" onClick={() => void logout()}>
            <LogOut size={18} /> Sign out
          </Button>
          <div className="small-brand">GROWING BETTER, TOGETHER.</div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <span>
            FARM INTELLIGENCE <span className="top-dot">/</span> YOUR DAILY
            PERSPECTIVE
          </span>
          <div>
            <button
              className="locale"
              onClick={() => dispatch(setLocale(locale === 'en' ? 'hi' : 'en'))}
            >
              {locale === 'en' ? 'हिन्दी' : 'English'}
            </button>
            <Link href="/profile" className="avatar" aria-label="Open profile">
              {initial}
            </Link>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer>
          KRASHAQ AGRITECH <span>Rooted in knowledge. Growing with you.</span>
        </footer>
      </div>
    </div>
  );
}
