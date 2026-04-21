"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function logout(): Promise<void> {
    await fetch("/api/access/logout", {
      method: "POST"
    });

    router.push("/");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" onClick={logout}>
      Log out
    </Button>
  );
}
