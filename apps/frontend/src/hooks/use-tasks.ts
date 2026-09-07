'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/toast';
import { api } from '@/lib/api';
import { errMessage } from '@/lib/errors';

export type Task = {
  id: number;
  description: string;
  dueDate: string | null;
  finishedAt: string | null;
};

export type TaskBody = { description: string; dueDate?: string | null };

export function tasksKey(projectId: string) {
  return ['projects', projectId, 'tasks'] as const;
}

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: tasksKey(projectId),
    queryFn: () => api<Task[]>(`/projects/${projectId}/tasks`),
    enabled: Boolean(projectId),
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TaskBody) =>
      api<Task>(`/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (task) => {
      toast.success('Task created');
      qc.setQueryData<Task[]>(tasksKey(projectId), (list) =>
        list ? [...list, task] : [task],
      );
    },
    onError: (e) => toast.error(errMessage(e)),
  });
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: TaskBody }) =>
      api<Task>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: (task) => {
      toast.success('Task updated');
      qc.setQueryData<Task[]>(tasksKey(projectId), (list) =>
        list?.map((t) => (t.id === task.id ? task : t)),
      );
    },
    onError: (e) => toast.error(errMessage(e)),
  });
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: (_void, id) => {
      qc.setQueryData<Task[]>(tasksKey(projectId), (list) =>
        list?.filter((t) => t.id !== id),
      );
    },
    onError: (e) => toast.error(errMessage(e)),
  });
}

export function useCompleteTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<Task>(`/tasks/${id}/complete`, { method: 'POST' }),
    onSuccess: (task) => {
      qc.setQueryData<Task[]>(tasksKey(projectId), (list) =>
        list?.map((t) => (t.id === task.id ? task : t)),
      );
    },
    onError: (e) => toast.error(errMessage(e)),
  });
}
