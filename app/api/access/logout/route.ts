import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME } from "@/lib/access";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/"
  });

  return response;
}
