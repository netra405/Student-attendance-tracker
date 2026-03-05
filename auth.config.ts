// import type { NextAuthConfig } from 'next-auth';
// import Credentials from 'next-auth/providers/credentials';
// import Google from 'next-auth/providers/google';
// import { connectDB } from '@/lib/db';
// import User from '@/models/User';

// export const authConfig = {
//   pages: {
//     signIn: '/login',
//   },
//   secret: process.env.NEXTAUTH_SECRET,
//   session: {
//     strategy: 'jwt',
//   },
//   trustHost: true,
//   providers: [
//     Google({
//       clientId: process.env.GOOGLE_ID,
//       clientSecret: process.env.GOOGLE_SECRET,
//     }),
//     Credentials({
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           throw new Error('Invalid credentials');
//         }

//         await connectDB();

//         const user = await User.findOne({ email: credentials.email }).select(
//           '+password'
//         );

//         if (!user) {
//           throw new Error('No user found with this email');
//         }

//         const passwordsMatch = await user.comparePassword(
//           credentials.password as string
//         );

//         if (!passwordsMatch) {
//           throw new Error('Incorrect password');
//         }

//         return {
//           id: user._id.toString(),
//           email: user.email,
//           name: user.name,
//           image: user.image,
//           role: user.role,
//         };
//       },
//     }),
//   ],
//   callbacks: {
//     async signIn({ user, account }) {
//       if (account?.provider === 'credentials') {
//         return true;
//       }

//       await connectDB();

//       const existingUser = await User.findOne({ email: user.email });

//       if (!existingUser) {
//         await User.create({
//           email: user.email,
//           name: user.name,
//           image: user.image,
//           role: 'teacher',
//         });
//       } else {
//         await User.updateOne(
//           { email: user.email },
//           { image: user.image, name: user.name }
//         );
//       }

//       return true;
//     },
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//         token.role = (user as any).role || 'teacher';
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = token.id as string;
//         (session.user as any).role = token.role;
//       }
//       return session;
//     },
//   },
// } satisfies NextAuthConfig;


import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const authConfig = {
  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  trustHost: true,

  providers: [
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),

    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        if (typeof credentials.email !== "string") {
          throw new Error("Invalid email format");
        }

        await connectDB();

        const email = credentials.email.toLowerCase();

        const user = await User.findOne({
          email,
        }).select("+password");

        if (!user) {
          throw new Error("No user found");
        }

        const passwordMatch = await user.comparePassword(
          credentials.password as string
        );

        if (!passwordMatch) {
          throw new Error("Incorrect password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      await connectDB();

      const email = user.email?.toLowerCase();

      if (!email) {
        throw new Error("Invalid email");
      }

      const existingUser = await User.findOne({ email });
      const adminCount = await User.countDocuments({ role: "admin" });

      /**
       * ⭐ Google Authentication Protection
       *
       * - If this email already belongs to an admin → block Google login
       * - If no admin exists yet and this email is new → create FIRST admin via Google
       * - If an admin exists and this email is new → block Google signup
       */
      if (account?.provider === "google") {
        // If this email already belongs to an admin → force manual login
        if (existingUser && existingUser.role === "admin") {
          throw new Error(
            "Admin accounts cannot use Google login. Please sign in with email and password."
          );
        }

        // If no admin exists and this email is new → create FIRST admin via Google
        if (!existingUser && adminCount === 0) {
          const created = await User.create({
            email,
            name: user.name,
            image: user.image,
            role: "admin",
            emailVerified: true,
          });

          (user as any).id = created._id.toString();
          (user as any).role = created.role;

          return true;
        }

        // If an admin already exists and this email is new → block Google signup
        if (!existingUser && adminCount > 0) {
          throw new Error(
            "Registration is closed. Admin already exists and Google signup is disabled."
          );
        }

        // Non-admin existing users could be allowed here in future if needed
        if (!existingUser) {
          throw new Error("You do not have permission to sign in.");
        }

        return true;
      }

      /**
       * ⭐ Credentials Authentication Path
       *
       * Manual login is allowed for the existing admin account.
       */
      if (account?.provider === "credentials") {
        return true;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;