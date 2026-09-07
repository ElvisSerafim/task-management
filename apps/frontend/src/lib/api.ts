import { fetchAction } from "@/actions/fetch";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const body = typeof init.body === "string" ? init.body : undefined;
  const res = await fetchAction(path, { method: init.method, body });

  if (res.status === 401 && !path.startsWith("/auth/")) {
    location.replace("/");
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const raw = (res.json as { message?: string | string[] } | null)?.message;
    throw new Error(
      Array.isArray(raw) ? raw.join(", ") : (raw ?? "Request failed"),
    );
  }

  return res.json as T;
}
