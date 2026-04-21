"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AccessUnlockFormProps {
  nextPath: string;
}

export function AccessUnlockForm({ nextPath }: AccessUnlockFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/access/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nextPath })
      });

      const payload = (await response.json()) as { error?: string; nextPath?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to unlock access.");
      }

      router.push(payload.nextPath ?? "/dashboard");
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to unlock access.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <Input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email used at checkout"
      />
      {error ? <p className="text-sm text-pink-300">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? "Checking purchase..." : "Unlock Dashboard"}
      </Button>
    </form>
  );
}
