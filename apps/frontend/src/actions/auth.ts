"use server";

import { cookies } from "next/headers";
import { ACCESS_TOKEN, fetchOrigin } from "@/lib/backend";

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24,
};

export async function loginAction(credentials: {
  username: string;
  password: string;
}): Promise<{ error?: string }> {
  const res = await fetch(`${fetchOrigin()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (res.status === 401) return { error: "Invalid credentials" };
  if (!res.ok) return { error: "Request failed" };

  const { accessToken } = (await res.json()) as { accessToken: string };
  const store = await cookies();
  store.set(ACCESS_TOKEN, accessToken, cookieOpts);
  return {};
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN);
}
