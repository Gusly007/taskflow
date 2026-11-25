import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/login-form';
import { Alert } from '@/components/ui/alert';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { next, expired } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back to TaskFlow.</p>
      </div>
      {expired && <Alert tone="info">Your session has expired. Please sign in again.</Alert>}
      <LoginForm next={typeof next === 'string' ? next : undefined} />
      <p className="text-center text-sm text-muted-foreground">
        No account yet?{' '}
        <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </div>
  );
}
