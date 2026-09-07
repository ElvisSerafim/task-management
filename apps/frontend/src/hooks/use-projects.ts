"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { api } from "@/lib/api";
import { errMessage } from "@/lib/errors";

export type Project = { id: number; title: string };

export const projectsKey = ["projects"] as const;

export function useProjects() {
  return useQuery({
    queryKey: projectsKey,
    queryFn: () => api<Project[]>("/projects"),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      api<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    onSuccess: (project) => {
      toast.success("Project created");
      qc.setQueryData<Project[]>(projectsKey, (list) =>
        list ? [...list, project] : [project],
      );
    },
    onError: (e) => toast.error(errMessage(e)),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      api<Project>(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }),
    onSuccess: (project) => {
      toast.success("Project updated");
      qc.setQueryData<Project[]>(projectsKey, (list) =>
        list?.map((p) => (p.id === project.id ? project : p)),
      );
      qc.setQueryData(["projects", String(project.id)], project);
    },
    onError: (e) => toast.error(errMessage(e)),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: (_void, id) => {
      qc.setQueryData<Project[]>(projectsKey, (list) =>
        list?.filter((p) => p.id !== id),
      );
    },
    onError: (e) => toast.error(errMessage(e)),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => api<Project>(`/projects/${id}`),
    enabled: Boolean(id),
  });
}
