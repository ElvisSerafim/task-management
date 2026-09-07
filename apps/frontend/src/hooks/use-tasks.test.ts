import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/toast";
import { api } from "@/lib/api";
import {
  tasksKey,
  useCompleteTask,
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
  type Task,
} from "./use-tasks";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));
vi.mock("@/components/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const apiMock = vi.mocked(api);
const toastError = vi.mocked(toast.error);
const projectId = "1";
const key = tasksKey(projectId);

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

const existing: Task[] = [
  { id: 1, description: "Draft", dueDate: null, finishedAt: null },
];

describe("task hooks", () => {
  beforeEach(() => {
    apiMock.mockReset();
    toastError.mockReset();
  });

  it("create appends to the list", async () => {
    const qc = client();
    qc.setQueryData(key, existing);
    const created: Task = {
      id: 2,
      description: "Review",
      dueDate: "2026-09-10",
      finishedAt: null,
    };
    apiMock.mockResolvedValue(created);

    const { result } = renderHook(() => useCreateTask(projectId), {
      wrapper: wrap(qc),
    });
    await result.current.mutateAsync({ description: "Review", dueDate: "2026-09-10" });

    expect(qc.getQueryData(key)).toEqual([...existing, created]);
  });

  it("update replaces by id", async () => {
    const qc = client();
    qc.setQueryData(key, existing);
    const updated: Task = {
      id: 1,
      description: "Drafted",
      dueDate: null,
      finishedAt: null,
    };
    apiMock.mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateTask(projectId), {
      wrapper: wrap(qc),
    });
    await result.current.mutateAsync({
      id: 1,
      body: { description: "Drafted" },
    });

    expect(qc.getQueryData(key)).toEqual([updated]);
  });

  it("complete replaces finishedAt", async () => {
    const qc = client();
    qc.setQueryData(key, existing);
    const done: Task = {
      ...existing[0],
      finishedAt: "2026-09-07T12:00:00.000Z",
    };
    apiMock.mockResolvedValue(done);

    const { result } = renderHook(() => useCompleteTask(projectId), {
      wrapper: wrap(qc),
    });
    await result.current.mutateAsync(1);

    expect(qc.getQueryData<Task[]>(key)?.[0].finishedAt).toBe(done.finishedAt);
  });

  it("delete removes by id", async () => {
    const qc = client();
    qc.setQueryData(key, [
      ...existing,
      { id: 2, description: "Other", dueDate: null, finishedAt: null },
    ]);
    apiMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteTask(projectId), {
      wrapper: wrap(qc),
    });
    await result.current.mutateAsync(1);

    expect(qc.getQueryData(key)).toEqual([
      { id: 2, description: "Other", dueDate: null, finishedAt: null },
    ]);
  });

  it("create onError toasts", async () => {
    const qc = client();
    apiMock.mockRejectedValue(new Error("invalid"));

    const { result } = renderHook(() => useCreateTask(projectId), {
      wrapper: wrap(qc),
    });
    await expect(
      result.current.mutateAsync({ description: "X" }),
    ).rejects.toThrow("invalid");
    expect(toastError).toHaveBeenCalledWith("invalid");
  });

  it("update onError toasts", async () => {
    const qc = client();
    apiMock.mockRejectedValue(new Error("locked"));

    const { result } = renderHook(() => useUpdateTask(projectId), {
      wrapper: wrap(qc),
    });
    await expect(
      result.current.mutateAsync({ id: 1, body: { description: "X" } }),
    ).rejects.toThrow("locked");
    expect(toastError).toHaveBeenCalledWith("locked");
  });

  it("delete onError toasts", async () => {
    const qc = client();
    apiMock.mockRejectedValue(new Error("gone"));

    const { result } = renderHook(() => useDeleteTask(projectId), {
      wrapper: wrap(qc),
    });
    await expect(result.current.mutateAsync(1)).rejects.toThrow("gone");
    expect(toastError).toHaveBeenCalledWith("gone");
  });

  it("complete onError toasts", async () => {
    const qc = client();
    apiMock.mockRejectedValue(new Error("already done"));

    const { result } = renderHook(() => useCompleteTask(projectId), {
      wrapper: wrap(qc),
    });
    await expect(result.current.mutateAsync(1)).rejects.toThrow("already done");
    expect(toastError).toHaveBeenCalledWith("already done");
  });
});
