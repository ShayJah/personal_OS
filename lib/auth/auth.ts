import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";

const nextAuth = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/spreadsheets",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      const dbUser = await prisma.user.upsert({
        where: { email: user.email },
        update: { name: user.name, image: user.image },
        create: {
          email: user.email,
          name: user.name,
          image: user.image,
          profile: { create: {} },
        },
      });

      // Auto-link Google Calendar right at sign-in, since we already request
      // calendar scope here — skips the separate "Connect Calendar" step.
      // `prompt: consent` above means Google returns a refresh_token on
      // every sign-in, not just the first, so this stays fresh.
      if (account?.provider === "google" && account.access_token && account.refresh_token) {
        await prisma.googleCalendarConnection.upsert({
          where: { userId: dbUser.id },
          create: {
            userId: dbUser.id,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at
              ? new Date(account.expires_at * 1000)
              : new Date(Date.now() + 3600_000),
            scope: account.scope ?? "",
          },
          update: {
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at
              ? new Date(account.expires_at * 1000)
              : new Date(Date.now() + 3600_000),
            scope: account.scope ?? "",
          },
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) token.sub = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

export const { handlers, signIn, signOut } = nextAuth;

// Local-only escape hatch: with DEV_BYPASS_AUTH=1 in `next dev`, skip Google sign-in and act as a seeded
// dev user. Hard-gated on NODE_ENV so it can never activate in a production build.
const DEV_BYPASS = process.env.NODE_ENV === "development" && process.env.DEV_BYPASS_AUTH === "1";
let devUserId: string | undefined;

async function devSession() {
  if (!devUserId) {
    const user = await prisma.user.upsert({
      where: { email: "dev@local" },
      update: {},
      create: { email: "dev@local", name: "Dev User", profile: { create: { onboardingDone: true } } },
    });
    devUserId = user.id;
  }
  return { user: { id: devUserId, name: "Dev User", email: "dev@local" }, expires: new Date(Date.now() + 86_400_000).toISOString() };
}

export const auth = ((...args: unknown[]) =>
  DEV_BYPASS ? devSession() : (nextAuth.auth as (...a: unknown[]) => unknown)(...args)) as typeof nextAuth.auth;
