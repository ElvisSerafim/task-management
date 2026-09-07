import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAction } from "@/actions/fetch";
import { api } from "./api";

vi.mock("@/actions/fetch", () => ({
  fetchAction: vi.fn(),
}));

const fetchActionMock = vi.mocked(fetchAction);

describe("api", () => {
  beforeEach(() => {
    fetchActionMock.mockReset();
  });

  it("throws a joined message array", async () => {
    fetchActionMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: { message: ["too short", "required"] },
    });
    await expect(api("/projects")).rejects.toThrow("too short, required");
  });

  it("throws a string message", async () => {
    fetchActionMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: { message: "nope" },
    });
    await expect(api("/projects")).rejects.toThrow("nope");
  });

  it("redirects on 401 outside /auth/", async () => {
    const replace = vi.fn();
    vi.stubGlobal("location", { replace });
    fetchActionMock.mockResolvedValue({ ok: false, status: 401, json: null });
    await expect(api("/projects")).rejects.toThrow("Unauthorized");
    expect(replace).toHaveBeenCalledWith("/");
    vi.unstubAllGlobals();
  });

  it("does not redirect on 401 under /auth/", async () => {
    const replace = vi.fn();
    vi.stubGlobal("location", { replace });
    fetchActionMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: { message: "bad credentials" },
    });
    await expect(api("/auth/signin", { method: "POST" })).rejects.toThrow(
      "bad credentials",
    );
    expect(replace).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
