import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Loader2, Link2, Shield, BarChart3, Zap } from 'lucide-react';
import Link from 'next/link';

const features = [
  { icon: Zap, text: 'Instant URL shortening' },
  { icon: Shield, text: 'AI-powered safety scanning' },
  { icon: BarChart3, text: 'Click analytics & tracking' },
];

export default function LoginPage() {
  return (
    <div className='min-h-screen flex'>
      {/* Left panel - branding */}
      <div className='hidden lg:flex flex-col w-[480px] shrink-0 bg-gradient-to-br from-violet-900 via-violet-800 to-fuchsia-900 p-12 text-white relative overflow-hidden'>
        {/* Background pattern */}
        <div
          className='absolute inset-0 opacity-10'
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />
        <div className='absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-fuchsia-600/20 blur-3xl' />

        {/* Logo */}
        <div className='relative flex items-center gap-3'>
          <div className='size-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center'>
            <Link2 className='size-5' />
          </div>
          <span className='text-xl font-bold'>ShortLink</span>
        </div>

        {/* Copy */}
        <div className='relative mt-auto'>
          <h2 className='text-4xl font-bold leading-tight mb-4'>
            Powerful links,
            <br />
            made simple.
          </h2>
          <p className='text-white/60 text-lg mb-10'>
            Every link is scanned by AI to protect you and your users.
          </p>

          <div className='space-y-4'>
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className='flex items-center gap-3'>
                <div className='size-8 rounded-lg bg-white/10 flex items-center justify-center'>
                  <Icon className='size-4' />
                </div>
                <span className='text-white/80 text-sm'>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className='flex-1 flex items-center justify-center p-6 bg-background'>
        <div className='w-full max-w-sm'>
          {/* Mobile logo */}
          <div className='lg:hidden flex items-center gap-2 mb-8'>
            <div className='size-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
              <Link2 className='size-4' />
            </div>
            <span className='font-bold text-lg'>ShortLink</span>
          </div>

          <h1 className='text-2xl font-bold mb-1'>Welcome back</h1>
          <p className='text-muted-foreground text-sm mb-8'>
            Sign in to your account to continue.
          </p>

          <Suspense
            fallback={
              <div className='flex justify-center py-12'>
                <Loader2 className='size-6 animate-spin text-muted-foreground' />
              </div>
            }
          >
            <LoginForm />
          </Suspense>

          <p className='text-center text-sm text-muted-foreground mt-6'>
            Don&apos;t have an account?{' '}
            <Link
              href='/register'
              className='font-medium text-violet-600 dark:text-violet-400 hover:underline'
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
