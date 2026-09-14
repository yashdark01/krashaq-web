import { expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '../src/proxy';

function request(path: string, cookie?: string) {
  return new NextRequest(`http://127.0.0.1:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

it('redirects unauthenticated private routes and admits public routes', () => {
  const denied = proxy(request('/chat?document=abc'));
  const location = new URL(denied.headers.get('location') ?? '');
  expect(location.pathname).toBe('/sign-in');
  expect(location.searchParams.get('next')).toBe('/chat?document=abc');
  expect(proxy(request('/sign-in')).headers.get('location')).toBeNull();
});

it('admits a refreshable private session and keeps authenticated users off sign-in', () => {
  expect(
    proxy(request('/profile', 'session_hint=1')).headers.get('location'),
  ).toBeNull();
  expect(
    new URL(
      proxy(request('/sign-in', 'access_token=opaque')).headers.get(
        'location',
      ) ?? '',
    ).pathname,
  ).toBe('/dashboard');
});
