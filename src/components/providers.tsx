'use client';
import { useRef, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type Store } from '@/store';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
export function Providers({ children }: { children: ReactNode }) {
  const ref = useRef<Store | null>(null);
  if (!ref.current) ref.current = makeStore();
  return (
    <Provider store={ref.current}>
      <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false} themes={['light', 'dark']}>
        {children}
        <Toaster position="bottom-right" richColors />
      </ThemeProvider>
    </Provider>
  );
}
