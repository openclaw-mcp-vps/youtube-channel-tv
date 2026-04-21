import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "@/lib/access";

export async function getViewerEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyAccessToken(token);
  return payload?.email ?? null;
}

export async function requirePaidAccess(nextPath: string): Promise<string> {
  const email = await getViewerEmail();

  if (!email) {
    redirect(`/unlock?next=${encodeURIComponent(nextPath)}`);
  }

  return email;
}

export function getRequestViewerEmail(request: NextRequest): string | null {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyAccessToken(token);
  return payload?.email ?? null;
}
