'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUpRight, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authenticated } from '@/features/auth/auth.slice';
import { getJson, mutate } from '@/lib/api/http-client';
import { safeNextPath } from '@/lib/auth/route-access';
import { useAppDispatch } from '@/store/hooks';

const credentialsSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(12, 'Use at least 12 characters.'),
});
type Credentials = z.infer<typeof credentialsSchema>;
type SessionIdentity = { sub: string; tenantId: string; sid?: string };

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/** A new account's farm profile is provisioned asynchronously by the account service. */
async function waitForProfile() {
  const deadline = Date.now() + 20_000;
  for (;;) {
    try {
      await getJson('profile');
      return;
    } catch (error) {
      const provisioning =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        (error as { status?: number }).status === 409;
      if (!provisioning || Date.now() >= deadline) throw error;
      await delay(250);
    }
  }
}

function messageFor(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Unable to complete your request.';
}

/** Authentication form stores only the verified session identity in Redux; tokens stay HttpOnly. */
export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({ resolver: zodResolver(credentialsSchema) });
  const isSignUp = mode === 'sign-up';
  async function submit(input: Credentials) {
    setError('');
    try {
      if (isSignUp) await mutate('auth/register', input);
      await mutate('auth/login', input);
      const identity = await getJson<SessionIdentity>('auth/me');
      if (isSignUp) await waitForProfile();
      dispatch(authenticated(identity));
      router.replace(safeNextPath(search.get('next')));
      router.refresh();
    } catch (reason) {
      setError(messageFor(reason));
    }
  }
  return (
    <div className="auth">
      <div className="auth-art">
        <Sprout size={50} />
        <h1>
          A little clarity.
          <br />A better season.
        </h1>
        <p>Your land. Your questions. Intelligence that grows with you.</p>
      </div>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <span className="eyebrow">KRASHAQ AGRITECH</span>
        <h2>{isSignUp ? 'Create your account' : 'Welcome back'}</h2>
        <p className="muted">A clearer view of what matters to your farm.</p>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            {...register('email')}
          />
        </label>
        {errors.email && (
          <p role="alert" className="error">
            {errors.email.message}
          </p>
        )}
        <label>
          Password
          <input
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            {...register('password')}
          />
        </label>
        {errors.password && (
          <p role="alert" className="error">
            {errors.password.message}
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <Button disabled={isSubmitting}>
          {isSubmitting
            ? isSignUp
              ? 'Creating account…'
              : 'Signing in…'
            : isSignUp
              ? 'Create account'
              : 'Sign in'}{' '}
          <ArrowUpRight size={16} />
        </Button>
        <p>
          {isSignUp ? 'Already have an account?' : 'New to Krashaq?'}{' '}
          <Link href={isSignUp ? '/sign-in' : '/sign-up'}>
            {isSignUp ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </form>
    </div>
  );
}
