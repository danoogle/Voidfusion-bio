import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [netlifyIdentity, setNetlifyIdentity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      import('netlify-identity-widget').then((identity) => {
        const netlifyIdentityModule = identity.default;
        netlifyIdentityModule.init();
        setNetlifyIdentity(netlifyIdentityModule);

        const currentUser = netlifyIdentityModule.currentUser();
        setUser(currentUser);
        setLoading(false);

        netlifyIdentityModule.on('login', (user) => {
          setUser(user);
          netlifyIdentityModule.close();
        });

        netlifyIdentityModule.on('logout', () => {
          setUser(null);
        });
      });
    }
  }, []);

  const login = () => {
    if (netlifyIdentity) {
      netlifyIdentity.open('login');
    }
  };

  const logout = () => {
    if (netlifyIdentity) {
      netlifyIdentity.logout();
    }
  };

  const isAuthorizedUser = () => {
    // Check if user is logged in and matches the authorized email
    const authorizedEmail = 'dssilmmain@gmail.com';
    return user && user.email && user.email.toLowerCase() === authorizedEmail.toLowerCase();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthorizedUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
