'use client';
import { useRef, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type Store } from '@/store';
import { Toaster } from 'sonner';
export function Providers({ children }: { children: ReactNode }) {
  const ref = useRef<Store | null>(null);
  if (!ref.current) ref.current = makeStore();
  return (
    <Provider store={ref.current}>
      {children}
      <Toaster position="bottom-right" richColors />
    </Provider>
  );
}
