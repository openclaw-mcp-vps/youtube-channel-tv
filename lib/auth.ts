import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "dev-auth-secret",
  session: {
    strategy: "jwt"
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" }
      },
      async authorize(credentials) {
        const emailRaw = credentials?.email;
        if (!emailRaw || typeof emailRaw !== "string") {
          return null;
        }

        const email = emailRaw.trim().toLowerCase();
        if (!email.includes("@")) {
          return null;
        }

        const nameRaw = credentials?.name;
        const parsedName = typeof nameRaw === "string" ? nameRaw.trim() : "";

        return {
          id: email,
          email,
          name: parsedName.length > 0 ? parsedName : email.split("@")[0]
        };
      }
    })
  ],
  pages: {
    signIn: "/"
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = String(token.email);
      }

      if (session.user && token.name) {
        session.user.name = String(token.name);
      }

      return session;
    }
  }
});
