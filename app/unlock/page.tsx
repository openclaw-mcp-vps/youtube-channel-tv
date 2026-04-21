import Link from "next/link";
import { AccessUnlockForm } from "@/components/AccessUnlockForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UnlockPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function UnlockPage({ searchParams }: UnlockPageProps) {
  const resolvedParams = await searchParams;
  const nextPath = resolvedParams.next ?? "/dashboard";

  return (
    <main className="mx-auto grid min-h-screen max-w-4xl place-items-center px-6 py-16">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-3xl">Unlock Your Channel Dashboard</CardTitle>
          <CardDescription>
            Purchase first, then unlock access using the same checkout email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AccessUnlockForm nextPath={nextPath} />
          <Button asChild variant="outline" className="w-full">
            <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK} target="_blank" rel="noreferrer">
              Buy Access for $8/mo
            </a>
          </Button>
          <p className="text-center text-sm text-slate-400">
            Need a quick overview first? <Link href="/" className="text-cyan-300 underline">Back to landing page</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
