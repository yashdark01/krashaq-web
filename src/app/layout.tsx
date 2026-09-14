import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';
import './knowledge.css';
import './auth.css';
export const metadata: Metadata = {
  title: 'Krashaq · Your farm, understood',
  description: 'Farm intelligence, weather and trusted knowledge',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
