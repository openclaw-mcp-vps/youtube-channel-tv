import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createUser, getUserByEmail } from "@/lib/db";
import { normalizeEmail } from "@/lib/utils";

const PASSWORD_SCRYPT_KEYLEN = 64;

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, PASSWORD_SCRYPT_KEYLEN).toString("hex");
}

function verifyPassword(password: string, salt: string, storedHash: string) {
  const nextHash = hashPassword(password, salt);
  return timingSafeEqual(Buffer.from(nextHash, "hex"), Buffer.from(storedHash, "hex"));
}

function createSalt() {
  return randomBytes(16).toString("hex");
}

const authSecret =
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "change-me-before-production";

const credentialsProvider = Credentials({
  name: "Email + Password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" }
  },
  authorize: async (credentials) => {
    const emailInput = String(credentials?.email ?? "").trim();
    const password = String(credentials?.password ?? "");

    if (!emailInput || !password || password.length < 8) {
      return null;
    }

    const email = normalizeEmail(emailInput);
    let user = await getUserByEmail(email);

    if (!user) {
      const salt = createSalt();
      const passwordHash = hashPassword(password, salt);
      user = await createUser({
        email,
        passwordHash,
        passwordSalt: salt
      });
    } else {
      const isValid = verifyPassword(password, user.passwordSalt, user.passwordHash);
      if (!isValid) {
        return null;
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.email.split("@")[0]
    };
  }
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  session: {
    strategy: "jwt"
  },
  providers: [credentialsProvider],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
      }

      return session;
    }
  }
});

export const ACCESS_COOKIE_NAME = "ytv_access";

const ACCESS_TOKEN_TTL_DAYS = 30;

function getAccessSecret() {
  return (
    process.env.ACCESS_COOKIE_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "change-this-access-secret"
  );
}

export function createAccessToken(email: string) {
  const payload = {
    email: normalizeEmail(email),
    exp: Date.now() + ACCESS_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getAccessSecret()).update(encodedPayload).digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyAccessToken(token: string | undefined, expectedEmail: string) {
  if (!token) return false;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expected = createHmac("sha256", getAccessSecret()).update(encodedPayload).digest("base64url");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8")) as {
      email: string;
      exp: number;
    };

    if (payload.exp <= Date.now()) {
      return false;
    }

    return normalizeEmail(payload.email) === normalizeEmail(expectedEmail);
  } catch {
    return false;
  }
}
