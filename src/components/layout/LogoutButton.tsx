"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="text-sm font-semibold text-body transition-colors hover:text-red disabled:opacity-50"
    >
      {isLoading ? "Logging out…" : "Log out"}
    </button>
  );
}
