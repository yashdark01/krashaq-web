export type ApiError = Error & {
  status?: number;
  code?: string;
  requestId?: string;
};
type ErrorEnvelope = {
  error?: { code?: string; message?: string; requestId?: string };
};

function apiPath(path: string) {
  return `/v1/${path.replace(/^\/+/, '')}`;
}

function readCookie(name: string) {
  return document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function csrfToken() {
  const current = readCookie('csrf_token');
  if (current) return decodeURIComponent(current);
  const response = await fetch('/v1/auth/csrf', {
    credentials: 'same-origin',
    headers: { accept: 'application/json' },
  });
  const data = await responseData<{ csrfToken: string }>(response);
  return data.csrfToken;
}

function createApiError(response: Response, body: ErrorEnvelope): ApiError {
  const error = Object.assign(
    new Error(body.error?.message ?? 'Request failed'),
    {
      status: response.status,
      code: body.error?.code,
      requestId: body.error?.requestId,
    },
  );
  return error;
}

async function responseData<T>(response: Response): Promise<T> {
  const data = (await response
    .json()
    .catch(() => ({ error: { message: 'Request failed' } }))) as T &
    ErrorEnvelope;
  if (!response.ok) throw createApiError(response, data);
  return data;
}

async function refreshCookies() {
  try {
    const token = await csrfToken();
    const response = await fetch('/v1/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { accept: 'application/json', 'x-csrf-token': token },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function requestWithRefresh(
  url: string,
  init: RequestInit,
  allowRefresh: boolean,
) {
  const response = await fetch(url, init);
  if (response.status !== 401 || !allowRefresh || !(await refreshCookies()))
    return response;
  return fetch(url, init);
}

/** JSON GETs always use the same-origin Gateway and browser-managed HttpOnly cookies. */
export async function getJson<T>(path: string): Promise<T> {
  return responseData<T>(
    await requestWithRefresh(
      apiPath(path),
      {
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
      },
      !path.startsWith('auth/'),
    ),
  );
}

/** Mutations use same-origin HttpOnly cookies; target services own validation and authorization. */
export async function mutate<T>(
  path: string,
  body?: unknown,
  method = 'POST',
): Promise<T> {
  const token = await csrfToken();
  const headers: Record<string, string> = {
    accept: 'application/json',
    'x-csrf-token': token,
  };
  if (body !== undefined) headers['content-type'] = 'application/json';
  return responseData<T>(
    await requestWithRefresh(
      apiPath(path),
      {
        method,
        credentials: 'same-origin',
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      !path.startsWith('auth/'),
    ),
  );
}

/** Multipart uploads retain browser-set boundaries while using the same CSRF and cookie policy. */
export async function uploadMultipart<T>(
  path: string,
  body: FormData,
): Promise<T> {
  const token = await csrfToken();
  return responseData<T>(
    await requestWithRefresh(
      apiPath(path),
      {
        method: 'POST',
        credentials: 'same-origin',
        headers: { accept: 'application/json', 'x-csrf-token': token },
        body,
      },
      true,
    ),
  );
}
