import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import type { PropsWithChildren } from 'react';

const replace = jest.fn();
const dispatch = jest.fn();
const mutate = jest.fn<(path: string, body?: unknown) => Promise<unknown>>();
const getJson = jest.fn<(path: string) => Promise<unknown>>();

jest.unstable_mockModule('next/navigation', () => ({
  useRouter: () => ({ replace, refresh: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));
jest.unstable_mockModule('@/lib/api/http-client', () => ({ mutate, getJson }));
jest.unstable_mockModule('@/store/hooks', () => ({
  useAppDispatch: () => dispatch,
}));
jest.unstable_mockModule('next/link', () => ({
  default: ({
    children,
    ...props
  }: PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}));

const { AuthForm } = await import('@/features/auth/auth-form');

describe('sign-up form', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects mismatched passwords without calling the auth API', async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="sign-up" />);
    await user.type(screen.getByLabelText('Email'), 'member@example.test');
    await user.type(screen.getByLabelText('Password'), 'StrongPassword123');
    await user.type(screen.getByLabelText('Confirm'), 'DifferentPassword123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Passwords do not match',
    );
    expect(mutate).not.toHaveBeenCalled();
  });

  it('uses cookie-only auth APIs and sends a new user to onboarding', async () => {
    const user = userEvent.setup();
    mutate.mockResolvedValue({});
    getJson.mockImplementation(async (path: string) =>
      path === 'auth/me'
        ? {
            sub: '1',
            tenantId: '2',
            role: 'user',
            expiresAt: '2030-01-01T00:00:00Z',
          }
        : { active_farm_id: null },
    );
    render(<AuthForm mode="sign-up" />);
    await user.type(screen.getByLabelText('Email'), 'member@example.test');
    await user.type(screen.getByLabelText('Password'), 'StrongPassword123');
    await user.type(screen.getByLabelText('Confirm'), 'StrongPassword123');
    fireEvent.submit(
      screen.getByRole('button', { name: /create account/i }).closest('form')!,
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/onboarding'));
    expect(mutate).toHaveBeenNthCalledWith(
      1,
      'auth/register',
      expect.objectContaining({ email: 'member@example.test' }),
    );
    expect(mutate).toHaveBeenNthCalledWith(2, 'auth/login', expect.any(Object));
    expect(getJson).toHaveBeenCalledWith('auth/me');
    expect(getJson).toHaveBeenCalledWith('profile');
  });
});
