import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Channel not found</p>
        <h1 className="text-4xl">The channel you requested is unavailable.</h1>
        <Button asChild>
          <Link href="/dashboard">Return to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
