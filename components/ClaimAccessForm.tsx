"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClaimAccessFormProps {
  email: string;
}

export function ClaimAccessForm({ email }: ClaimAccessFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(email);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function claimAccess() {
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: value })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not verify purchase for this account.");
      }

      setStatus(payload.message ?? "Access unlocked. Redirecting to dashboard...");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to claim access right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        type="email"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Checkout email"
      />
      <Button onClick={claimAccess} disabled={loading || !value.trim()}>
        {loading ? "Verifying..." : "Unlock My Account"}
      </Button>
      {status ? <p className="text-sm text-zinc-300">{status}</p> : null}
    </div>
  );
}
