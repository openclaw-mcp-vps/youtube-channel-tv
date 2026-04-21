import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clearAccessCookie, getAccessFromRequest, setAccessCookie } from "@/lib/auth";
import { addChannelForEmail, getChannelsForEmail, hasPurchase, removeChannelForEmail } from "@/lib/db";
import { resolveChannel } from "@/lib/youtube";

const verifyPayload = z.object({
  action: z.literal("verify"),
  email: z.string().email()
});

const addPayload = z.object({
  action: z.literal("add"),
  query: z.string().min(2)
});

const removePayload = z.object({
  action: z.literal("remove"),
  channelId: z.string().min(1)
});

const logoutPayload = z.object({
  action: z.literal("logout")
});

async function readJsonPayload(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const access = getAccessFromRequest(request);
  if (!access) {
    return NextResponse.json({ error: "Access is locked. Verify your purchase first." }, { status: 401 });
  }

  const channels = await getChannelsForEmail(access.email);
  return NextResponse.json({ channels, email: access.email });
}

export async function POST(request: NextRequest) {
  const payload = await readJsonPayload(request);
  if (!payload || typeof payload !== "object" || !("action" in payload)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const action = String(payload.action);

  if (action === "verify") {
    const parsed = verifyPayload.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid purchase email." }, { status: 400 });
    }

    const paid = await hasPurchase(parsed.data.email);
    if (!paid) {
      return NextResponse.json(
        {
          error:
            "No paid subscription was found for that email yet. Complete checkout first, then try again after a few seconds."
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ ok: true });
    setAccessCookie(response, parsed.data.email);
    return response;
  }

  if (action === "logout") {
    const parsed = logoutPayload.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid logout payload." }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    clearAccessCookie(response);
    return response;
  }

  const access = getAccessFromRequest(request);
  if (!access) {
    return NextResponse.json({ error: "Access is locked. Verify your purchase first." }, { status: 401 });
  }

  if (action === "add") {
    const parsed = addPayload.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Add a valid channel URL, @handle, or channel ID." }, { status: 400 });
    }

    try {
      const channel = await resolveChannel(parsed.data.query);
      const channels = await addChannelForEmail(access.email, {
        channelId: channel.channelId,
        title: channel.title,
        description: channel.description,
        thumbnailUrl: channel.thumbnailUrl,
        handle: channel.handle,
        videoCount: channel.videoCount
      });

      return NextResponse.json({ ok: true, channels });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add this channel.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (action === "remove") {
    const parsed = removePayload.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "A channel id is required." }, { status: 400 });
    }

    const channels = await removeChannelForEmail(access.email, parsed.data.channelId);
    return NextResponse.json({ ok: true, channels });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
