"use server";

import { cookies } from "next/headers";
import { ACCESS_TOKEN, fetchOrigin } from "@/lib/backend";

export async function fetchAction(
  path: string,
  init: { method?: string; body?: string } = {},
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN)?.value;
  const headers: Record<string, string> = {};
  if (init.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${fetchOrigin()}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body,
    cache: "no-store",
  });

  if (res.status === 401) store.delete(ACCESS_TOKEN);

  return {
    ok: res.ok,
    status: res.status,
    json: res.status === 204 ? undefined : await res.json().catch(() => null),
  };
}
