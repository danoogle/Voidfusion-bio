import GoogleProvider from 'next-auth/providers/google';

// List of allowed email addresses
const ALLOWED_EMAILS = [
  'dssilmmain@gmail.com',
];

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow sign in if the email is in the allowed list
      if (ALLOWED_EMAILS.includes(user.email)) {
        return true;
      }
      // Reject sign in for unauthorized emails
      return false;
    },
    async session({ session, token }) {
      // Add user info to session
      session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
