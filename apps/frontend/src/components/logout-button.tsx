"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mb-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-200"
      onClick={async () => {
        await logoutAction();
        router.replace("/");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
