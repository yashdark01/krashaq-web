import { AuthForm } from '@/features/auth/auth-form';
import { Suspense } from 'react';

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="sign-in" />
    </Suspense>
  );
}
