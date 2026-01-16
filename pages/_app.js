import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css';
import 'prismjs/themes/prism-tomorrow.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <span className="theme-bejamas" />
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
