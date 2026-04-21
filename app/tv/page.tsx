import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import TVPlayer from "@/components/TVPlayer";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getLineupByEmail } from "@/lib/storage";
import { hasActiveAccess } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function TVPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const hasAccess = hasActiveAccess(cookieStore, email);

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const lineup = await getLineupByEmail(email);

  if (lineup.channels.length === 0) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-4xl px-5 pb-16 pt-12 text-center sm:px-8">
        <h1 className="text-3xl font-semibold">Your TV guide is empty</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          Add at least one creator channel in your dashboard so the TV stream has content to queue.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block">
          <Button>Go to Dashboard</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 pb-16 pt-8 sm:px-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Live TV</p>
          <h1 className="text-3xl font-bold">{email}&apos;s YouTube Channels</h1>
          <p className="text-sm text-slate-300">Continuous creator playback with quick channel switching.</p>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary">Edit Lineup</Button>
        </Link>
      </header>

      <TVPlayer channels={lineup.channels} />
    </main>
  );
}
