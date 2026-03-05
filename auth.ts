import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

const config = {
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
};

export const { auth, signIn, signOut, handlers } = NextAuth(config);
