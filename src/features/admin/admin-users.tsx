'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getJson, mutate } from '@/lib/api/http-client';
import { useAppSelector } from '@/store/hooks';

type Role = 'user' | 'admin';
type AdminUser = {
  id: string;
  email: string;
  tenantId: string;
  role: Role;
  createdAt: string;
};
type UserPage = { users: AdminUser[]; nextCursor: string | null };

export function AdminUsers() {
  const router = useRouter();
  const identity = useAppSelector((state) => state.auth.identity);
  const [page, setPage] = useState<UserPage>();
  const [cursor, setCursor] = useState<string>();
  const [history, setHistory] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!identity) return;
    if (identity.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    setLoading(true);
    void getJson<UserPage>(
      `admin/users?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
    )
      .then(setPage)
      .catch((error) =>
        setMessage(
          error instanceof Error ? error.message : 'Unable to load users.',
        ),
      )
      .finally(() => setLoading(false));
  }, [cursor, identity, router]);

  async function changeRole(user: AdminUser, role: Role) {
    if (
      !window.confirm(
        `${role === 'admin' ? 'Promote' : 'Demote'} ${user.email}?`,
      )
    )
      return;
    try {
      const updated = await mutate<AdminUser>(
        `admin/users/${user.id}/role`,
        { role },
        'PATCH',
      );
      setPage(
        (current) =>
          current && {
            ...current,
            users: current.users.map((item) =>
              item.id === updated.id ? updated : item,
            ),
          },
      );
      setMessage(`${updated.email} is now an ${updated.role}.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to update this user.',
      );
    }
  }

  if (!identity || identity.role !== 'admin')
    return (
      <section className="panel">
        <h1>Checking access…</h1>
      </section>
    );

  return (
    <section>
      <header className="section-title">
        <div>
          <span className="eyebrow">PLATFORM ADMINISTRATION</span>
          <h1>Users and roles</h1>
          <p className="muted">
            Manage account roles without accessing tenant farm data.
          </p>
        </div>
      </header>
      {message && <p role="status">{message}</p>}
      <div className="panel admin-users">
        {loading ? (
          <p>Loading users…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {page?.users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    <span className="context-pill">{user.role}</span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    {user.id === identity.sub ? (
                      <span className="muted">Your role</span>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          void changeRole(
                            user,
                            user.role === 'admin' ? 'user' : 'admin',
                          )
                        }
                      >
                        {user.role === 'admin' ? 'Demote' : 'Promote'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !page?.users.length && <p>No accounts found.</p>}
        <div className="admin-pagination">
          <Button
            variant="ghost"
            disabled={!history.length}
            onClick={() => {
              const next = [...history];
              setCursor(next.pop());
              setHistory(next);
            }}
          >
            Previous
          </Button>
          <Button
            disabled={!page?.nextCursor}
            onClick={() => {
              if (page?.nextCursor) {
                setHistory((items) => [...items, cursor ?? '']);
                setCursor(page.nextCursor);
              }
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
