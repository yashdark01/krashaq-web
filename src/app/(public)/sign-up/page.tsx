import { AuthForm } from '@/features/auth/auth-form';
import { Suspense } from 'react';

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="sign-up" />
    </Suspense>
  );
}
