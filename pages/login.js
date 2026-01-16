import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout, { GradientBackground } from '../components/Layout';
import SEO from '../components/SEO';
import { getGlobalData } from '../utils/global-data';

export default function Login({ globalData }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { error } = router.query;

  useEffect(() => {
    // If already authenticated, redirect to admin
    if (session) {
      router.push('/admin');
    }
  }, [session, router]);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/admin' });
  };

  if (status === 'loading') {
    return (
      <Layout>
        <SEO title="Login" description="Sign in to manage your blog" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-xl">Loading...</div>
        </div>
        <GradientBackground
          variant="large"
          className="fixed top-20 opacity-40 dark:opacity-60"
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Login" description="Sign in to manage your blog" />
      <main className="flex flex-col items-center justify-center min-h-[70vh] w-full px-4">
        <div className="w-full max-w-md p-8 rounded-xl bg-white/10 backdrop-blur-lg border border-gray-800/10 dark:bg-black/30 dark:border-white/10">
          <h1 className="text-3xl font-bold text-center mb-2">
            {globalData.blogTitle}
          </h1>
          <h2 className="text-xl text-center mb-8 opacity-80">
            Blog Admin Login
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-center">
              {error === 'AccessDenied' ? (
                <p>Access denied. Your email is not authorized to access this blog.</p>
              ) : (
                <p>An error occurred during sign in. Please try again.</p>
              )}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg bg-white text-gray-800 font-semibold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <p className="mt-6 text-sm text-center opacity-60">
            Only authorized accounts can access the blog admin.
          </p>
        </div>
      </main>
      <GradientBackground
        variant="large"
        className="fixed top-20 opacity-40 dark:opacity-60"
      />
      <GradientBackground
        variant="small"
        className="absolute bottom-0 opacity-20 dark:opacity-10"
      />
    </Layout>
  );
}

export function getStaticProps() {
  const globalData = getGlobalData();
  return { props: { globalData } };
}
