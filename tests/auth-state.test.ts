import { expect, it } from 'vitest';
import {
  authenticated,
  anonymous,
  authReducer,
} from '../src/features/auth/auth.slice';
import { safeNextPath } from '../src/lib/auth/route-access';

it('keeps the verified identity but never credentials in auth state', () => {
  const signedIn = authReducer(
    undefined,
    authenticated({
      sub: 'actor-1',
      tenantId: 'tenant-1',
      role: 'user',
      expiresAt: '2026-09-15T00:15:00.000Z',
    }),
  );
  expect(signedIn).toEqual({
    status: 'authenticated',
    identity: {
      sub: 'actor-1',
      tenantId: 'tenant-1',
      role: 'user',
      expiresAt: '2026-09-15T00:15:00.000Z',
    },
  });
  expect(JSON.stringify(signedIn)).not.toMatch(/token|password|credential/i);
  expect(authReducer(signedIn, anonymous())).toEqual({ status: 'anonymous' });
});

it('preserves local destinations and rejects open-redirect values', () => {
  expect(safeNextPath('/knowledge?document=abc')).toBe(
    '/knowledge?document=abc',
  );
  expect(safeNextPath('//attacker.example')).toBe('/dashboard');
  expect(safeNextPath('https://attacker.example')).toBe('/dashboard');
});
