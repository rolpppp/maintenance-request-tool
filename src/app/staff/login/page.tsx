import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getStaff } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Staff sign in' };

export default async function StaffLoginPage() {
  if (await getStaff()) redirect('/staff');

  return (
    <main className="mx-auto max-w-[400px] px-4 py-12">
      <div className="rounded-card border border-line bg-surface p-6 shadow-card">
        <h1 className="text-[28px] leading-[1.15] font-bold tracking-[-0.025em]">Staff sign in</h1>
        <p className="mt-2 text-muted">See and manage every maintenance request.</p>
        <LoginForm />
        <p className="mt-5 text-sm text-muted">Forgot your password? Ask the account owner to reset it.</p>
      </div>
      <p className="mt-5 text-center text-sm text-muted">
        Tenant? You don&apos;t need an account.{' '}
        <Link href="/" className="font-semibold text-accent underline underline-offset-2">
          Report a problem
        </Link>
      </p>
    </main>
  );
}
