import '../styles/globals.css';
import 'prismjs/themes/prism-tomorrow.css';
import { AuthProvider } from '../context/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <span className="theme-bejamas" />
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
