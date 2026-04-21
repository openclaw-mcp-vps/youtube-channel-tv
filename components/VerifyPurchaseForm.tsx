"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type VerifyResponse = {
  ok?: boolean;
  error?: string;
};

export default function VerifyPurchaseForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "verify", email })
      });

      const payload = (await response.json()) as VerifyResponse;

      if (!response.ok) {
        setError(payload.error ?? "Purchase verification failed.");
        return;
      }

      router.refresh();
    } catch {
      setError("Could not verify purchase right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-3" onSubmit={onSubmit}>
      <label className="block text-sm text-[#9aa4b2]" htmlFor="purchase-email">
        Enter the same email you used in Stripe checkout
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="h-11 flex-1 rounded-md border border-[#30363d] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none ring-[#58a6ff] placeholder:text-[#6e7681] focus:ring-2"
          id="purchase-email"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
          type="email"
          value={email}
        />
        <Button disabled={loading} type="submit">
          {loading ? "Verifying..." : "Unlock Dashboard"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[#ff7b72]">{error}</p> : null}
    </form>
  );
}
