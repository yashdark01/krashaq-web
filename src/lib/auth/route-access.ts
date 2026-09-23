export const publicRoutes = new Set([
  '/sign-in',
  '/sign-up',
  '/login',
  '/register',
]);

export function isPublicRoute(pathname: string) {
  return publicRoutes.has(pathname);
}

/** Avoid carrying an external URL through the sign-in redirect. */
export function safeNextPath(
  value: string | null | undefined,
  fallback = '/dashboard',
) {
  if (!value || !value.startsWith('/') || value.startsWith('//'))
    return fallback;
  return value;
}
