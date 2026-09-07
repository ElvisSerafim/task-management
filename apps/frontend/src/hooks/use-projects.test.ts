import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/toast";
import { api } from "@/lib/api";
import {
  projectsKey,
  useCreateProject,
  useDeleteProject,
  useUpdateProject,
  type Project,
} from "./use-projects";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));
vi.mock("@/components/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const apiMock = vi.mocked(api);
const toastError = vi.mocked(toast.error);

function client() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrap(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  };
}

const existing: Project[] = [{ id: 1, title: "Alpha" }];

describe("project hooks", () => {
  beforeEach(() => {
    apiMock.mockReset();
    toastError.mockReset();
  });

  it("create appends to the list", async () => {
    const qc = client();
    qc.setQueryData(projectsKey, existing);
    const created: Project = { id: 2, title: "Beta" };
    apiMock.mockResolvedValue(created);

    const { result } = renderHook(() => useCreateProject(), { wrapper: wrap(qc) });
    await result.current.mutateAsync("Beta");

    expect(qc.getQueryData(projectsKey)).toEqual([...existing, created]);
  });

  it("update replaces by id", async () => {
    const qc = client();
    qc.setQueryData(projectsKey, existing);
    const updated: Project = { id: 1, title: "Alpha 2" };
    apiMock.mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateProject(), { wrapper: wrap(qc) });
    await result.current.mutateAsync({ id: 1, title: "Alpha 2" });

    expect(qc.getQueryData(projectsKey)).toEqual([updated]);
  });

  it("delete removes by id", async () => {
    const qc = client();
    qc.setQueryData(projectsKey, [...existing, { id: 2, title: "Beta" }]);
    apiMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteProject(), { wrapper: wrap(qc) });
    await result.current.mutateAsync(1);

    expect(qc.getQueryData(projectsKey)).toEqual([{ id: 2, title: "Beta" }]);
  });

  it("create onError toasts", async () => {
    const qc = client();
    apiMock.mockRejectedValue(new Error("taken"));

    const { result } = renderHook(() => useCreateProject(), { wrapper: wrap(qc) });
    await expect(result.current.mutateAsync("Beta")).rejects.toThrow("taken");
    expect(toastError).toHaveBeenCalledWith("taken");
  });

  it("delete onError toasts", async () => {
    const qc = client();
    apiMock.mockRejectedValue(new Error("gone"));

    const { result } = renderHook(() => useDeleteProject(), { wrapper: wrap(qc) });
    await expect(result.current.mutateAsync(1)).rejects.toThrow("gone");
    expect(toastError).toHaveBeenCalledWith("gone");
  });
});
