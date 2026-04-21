import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { ClaimAccessForm } from "@/components/ClaimAccessForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Unlock Access",
  description: "Claim your YouTube Channel TV purchase and unlock TV mode."
};

export default async function SuccessPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-cyan-300" />
            Checkout Complete
          </CardTitle>
          <CardDescription>
            Final step: verify your purchase email to activate paid access on this account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ClaimAccessForm email={email} />
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
            Use the same email address from Stripe checkout. Once verified, your browser gets an access cookie and TV mode unlocks.
          </div>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Back To Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
