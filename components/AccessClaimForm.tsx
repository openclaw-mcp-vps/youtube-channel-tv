"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccessClaimFormProps = {
  defaultEmail: string;
};

export default function AccessClaimForm({ defaultEmail }: AccessClaimFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function claimAccess() {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/subscription/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to verify purchase.");
      }

      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to verify purchase.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@company.com"
        type="email"
      />
      <Button onClick={claimAccess} disabled={isSubmitting || !email}>
        {isSubmitting ? "Verifying..." : "Unlock My Access"}
      </Button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
