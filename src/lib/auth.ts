import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma"; 
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: {
    // Q&A WHY: We use JWT strategy instead of database sessions for faster verification 
    // at the edge/middleware level without hitting the DB on every protected route request.
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Q&A WHY: Generic error message here prevents username enumeration attacks.
        if (!user) {
          throw new Error("Invalid credentials"); 
        }

        // --- BUSINESS RULE: Lockout Check ---
        if (user.lockedUntil && new Date() < user.lockedUntil) {
          throw new Error("Invalid credentials. Account locked after 5 failed attempts.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          const newAttempts = user.failedLoginAttempts + 1;
          
          if (newAttempts >= 5) {
            // Lock out for 15 minutes
            // Q&A WHY: We lock at the DB level, not in-memory, to ensure serverless/edge environments 
            // share the lockout state and prevent distributed brute-force attacks.
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: newAttempts,
                lockedUntil: new Date(Date.now() + 15 * 60 * 1000), 
              },
            });
            throw new Error("Invalid credentials. Account locked after 5 failed attempts.");
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: newAttempts },
            });
            throw new Error("Invalid credentials");
          }
        }

        // Reset attempts on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Q&A WHY: Injecting role into JWT prevents us from having to query the DB in middleware
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};