'use client';

import { useProfileQuery } from '@/lib/api/platform.api';
import { useAppSelector } from '@/store/hooks';

/** Account information is derived from the verified session, never from browser storage. */
export function ProfileCard() {
  const identity = useAppSelector((state) => state.auth.identity);
  const { data: profile, error } = useProfileQuery();
  return (
    <section className="panel profile-card">
      <span className="eyebrow">YOUR ACCOUNT</span>
      <h1>Profile</h1>
      <p>
        {identity
          ? 'You are signed in with a secure, server-managed session.'
          : 'Your session is being verified.'}
      </p>
      <dl>
        <div>
          <dt>Tenant</dt>
          <dd>{identity?.tenantId ?? '—'}</dd>
        </div>
        <div>
          <dt>Language</dt>
          <dd>{profile?.locale ?? 'English'}</dd>
        </div>
        <div>
          <dt>Time zone</dt>
          <dd>{profile?.timezone ?? '—'}</dd>
        </div>
      </dl>
      {error && (
        <p role="alert" className="error">
          Your farming preferences are temporarily unavailable.
        </p>
      )}
    </section>
  );
}
