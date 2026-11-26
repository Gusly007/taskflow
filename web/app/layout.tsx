import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import { THEME_COOKIE, isTheme } from '@/features/theme/theme';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'TaskFlow', template: '%s · TaskFlow' },
  description: 'Manage your tasks and share them with collaborators.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // "system" (or no cookie) = no data-theme: globals.css then follows the OS setting.
  const theme = (await cookies()).get(THEME_COOKIE)?.value;
  const dataTheme = isTheme(theme) && theme !== 'system' ? theme : undefined;

  return (
    <html lang="en" data-theme={dataTheme} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
