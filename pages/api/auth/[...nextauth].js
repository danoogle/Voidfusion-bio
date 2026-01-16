import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// The only email allowed to access the admin panel
const ALLOWED_EMAIL = 'dssilmmain@gmail.com';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow the specific email to sign in
      if (user.email === ALLOWED_EMAIL) {
        return true;
      }
      // Reject all other users
      return false;
    },
    async session({ session, token }) {
      // Add user id to session
      session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
