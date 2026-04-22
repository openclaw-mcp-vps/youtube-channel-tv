import { NextRequest, NextResponse } from "next/server";

import {
  getViewerKeyFromRequest,
  requestHasPaidAccess,
  setPaidAccessCookies
} from "@/lib/auth";
import {
  addUserChannel,
  getUserChannels,
  hasPurchased,
  removeUserChannel
} from "@/lib/db";
import type { TVChannel } from "@/lib/types";

export const runtime = "nodejs";

function asChannel(input: unknown): TVChannel | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const channel = input as Record<string, unknown>;
  const channelId =
    typeof channel.channelId === "string" ? channel.channelId.trim() : "";
  const title = typeof channel.title === "string" ? channel.title.trim() : "";
  const thumbnail =
    typeof channel.thumbnail === "string" ? channel.thumbnail.trim() : "";
  const description =
    typeof channel.description === "string" ? channel.description.trim() : "";

  if (!channelId || !title || !thumbnail) {
    return null;
  }

  return {
    channelId,
    title,
    thumbnail,
    description
  };
}

async function readPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return {
      mode: "json" as const,
      data: (await request.json()) as Record<string, unknown>
    };
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    return {
      mode: "form" as const,
      data: Object.fromEntries(new URLSearchParams(text).entries())
    };
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return {
      mode: "form" as const,
      data: Object.fromEntries(formData.entries())
    };
  }

  return {
    mode: "json" as const,
    data: {}
  };
}

function makeUnauthorizedResponse() {
  return NextResponse.json({ error: "Payment required. Unlock first." }, { status: 403 });
}

export async function GET(request: NextRequest) {
  if (!requestHasPaidAccess(request)) {
    return makeUnauthorizedResponse();
  }

  const userKey = getViewerKeyFromRequest(request);

  if (!userKey) {
    return NextResponse.json({ channels: [] });
  }

  const channels = await getUserChannels(userKey);

  return NextResponse.json({ channels });
}

export async function POST(request: NextRequest) {
  const { data, mode } = await readPayload(request);

  const action = typeof data.action === "string" ? data.action : "";

  if (action === "unlock") {
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";

    if (!email) {
      if (mode === "form") {
        return NextResponse.redirect(new URL("/dashboard?unlock=failed", request.url));
      }

      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const purchased = await hasPurchased(email);

    if (!purchased) {
      if (mode === "form") {
        return NextResponse.redirect(new URL("/dashboard?unlock=failed", request.url));
      }

      return NextResponse.json(
        { error: "No paid purchase found for this email yet." },
        { status: 403 }
      );
    }

    if (mode === "form") {
      const response = NextResponse.redirect(
        new URL("/dashboard?unlock=success", request.url)
      );
      setPaidAccessCookies(response, email);
      return response;
    }

    const response = NextResponse.json({ ok: true });
    setPaidAccessCookies(response, email);
    return response;
  }

  if (!requestHasPaidAccess(request)) {
    return makeUnauthorizedResponse();
  }

  const userKey = getViewerKeyFromRequest(request);

  if (!userKey) {
    return NextResponse.json({ error: "No active paid identity." }, { status: 403 });
  }

  if (action === "add") {
    const channel = asChannel(data.channel);

    if (!channel) {
      return NextResponse.json(
        { error: "Invalid channel payload." },
        { status: 400 }
      );
    }

    const channels = await addUserChannel(userKey, channel);
    return NextResponse.json({ channels });
  }

  if (action === "remove") {
    const channelId =
      typeof data.channelId === "string" ? data.channelId.trim() : "";

    if (!channelId) {
      return NextResponse.json(
        { error: "Missing channelId." },
        { status: 400 }
      );
    }

    const channels = await removeUserChannel(userKey, channelId);
    return NextResponse.json({ channels });
  }

  return NextResponse.json(
    { error: "Unsupported action." },
    { status: 400 }
  );
}
