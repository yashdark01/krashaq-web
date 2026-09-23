'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  authenticated,
  anonymous,
  checkingSession,
} from '@/features/auth/auth.slice';
import { getJson, mutate, type ApiError } from '@/lib/api/http-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

type SessionIdentity = {
  sub: string;
  tenantId: string;
  role: 'user' | 'admin';
  expiresAt: string;
};

const previewIdentity: SessionIdentity = {
  sub: 'preview-user',
  tenantId: 'preview-tenant',
  role: 'user',
  expiresAt: '2099-12-31T23:59:59.000Z',
};

function isUnauthenticated(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    ((error as ApiError).status === 401 || (error as ApiError).status === 403)
  );
}

/** Resolves active sessions after middleware admits a request with access or refresh cookies. */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const searchString = search.toString();
  const status = useAppSelector((state) => state.auth.status);
  const identity = useAppSelector((state) => state.auth.identity);
  const [retry, setRetry] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    if (process.env.NODE_ENV !== 'production') {
      dispatch(authenticated(previewIdentity));
      return () => {
        active = false;
      };
    }
    async function load() {
      dispatch(checkingSession());
      setUnavailable(false);
      try {
        const identity = await getJson<SessionIdentity>('auth/me');
        if (active) dispatch(authenticated(identity));
        return;
      } catch (error) {
        if (!isUnauthenticated(error)) {
          if (active) setUnavailable(true);
          return;
        }
      }
      try {
        await mutate('auth/refresh');
        const identity = await getJson<SessionIdentity>('auth/me');
        if (active) dispatch(authenticated(identity));
      } catch (error) {
        if (!active) return;
        if (isUnauthenticated(error)) {
          dispatch(anonymous());
          router.replace(
            `/sign-in?next=${encodeURIComponent(`${pathname}${searchString ? `?${searchString}` : ''}`)}`,
          );
        } else setUnavailable(true);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [dispatch, pathname, retry, router, searchString]);
  useEffect(() => {
    if (status !== 'authenticated' || !identity) return;
    const delay = Math.max(
      1_000,
      Date.parse(identity.expiresAt) - Date.now() - 60_000,
    );
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await mutate('auth/refresh');
          dispatch(authenticated(await getJson<SessionIdentity>('auth/me')));
        } catch {
          dispatch(anonymous());
          router.replace('/sign-in');
        }
      })();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [dispatch, identity, router, status]);
  if (status === 'authenticated') return <>{children}</>;
  if (unavailable)
    return (
      <section className="session-state" role="alert">
        <h1>We can’t verify your session</h1>
        <p>Check that the Gateway is available, then try again.</p>
        <Button onClick={() => setRetry((value) => value + 1)}>
          Try again
        </Button>
      </section>
    );
  return (
    <section className="session-state" role="status" aria-live="polite">
      <h1>Checking your secure session</h1>
      <p>Loading your farm workspace…</p>
    </section>
  );
}
