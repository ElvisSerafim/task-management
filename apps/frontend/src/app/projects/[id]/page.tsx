"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { errMessage } from "@/lib/errors";
import { TaskForm } from "@/components/task-form";
import { TaskRow } from "@/components/task-row";
import { LogoutButton } from "@/components/logout-button";
import {
  useCompleteTask,
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
  type Task,
} from "@/hooks/use-tasks";
import { useProject } from "@/hooks/use-projects";

export default function ProjectTasksPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, error: projectError } = useProject(id);
  const { data: tasks = [], error: tasksError } = useTasks(id);
  const create = useCreateTask(id);
  const update = useUpdateTask(id);
  const remove = useDeleteTask(id);
  const complete = useCompleteTask(id);
  const [modal, setModal] = useState<"create" | Task | null>(null);
  const error = projectError ?? tasksError;
  const todo = tasks.filter((t) => t.finishedAt === null);
  const done = tasks.filter((t) => t.finishedAt !== null);

  async function save({
    description,
    dueDate,
  }: {
    description: string;
    dueDate: string;
  }) {
    const body: { description: string; dueDate?: string | null } = {
      description,
    };
    if (dueDate) body.dueDate = dueDate;
    else if (modal !== "create") body.dueDate = null;
    try {
      if (modal === "create") await create.mutateAsync(body);
      else if (modal) await update.mutateAsync({ id: modal.id, body });
      setModal(null);
    } catch {}
  }

  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <LogoutButton />
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/projects"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          ← Projects
        </Link>
        <div className="mb-6 mt-3 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {project?.title ?? "Tasks"}
          </h1>
          {projectError ? null : (
            <button
              className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              onClick={() => setModal("create")}
            >
              New task
            </button>
          )}
        </div>
        {error ? (
          <p className="mb-3 text-sm text-red-600">{errMessage(error)}</p>
        ) : null}
        <section className="mb-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            To-do
          </h2>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {todo.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                onComplete={() => complete.mutate(t.id)}
                onEdit={() => setModal(t)}
                onDelete={() => remove.mutate(t.id)}
              />
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Done
          </h2>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {done.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                onComplete={() => complete.mutate(t.id)}
                onEdit={() => setModal(t)}
                onDelete={() => remove.mutate(t.id)}
              />
            ))}
          </ul>
        </section>
      </div>
      <TaskForm
        key={
          modal === null ? "closed" : modal === "create" ? "create" : modal.id
        }
        open={modal !== null}
        task={modal === "create" || modal === null ? null : modal}
        onClose={() => setModal(null)}
        onSubmit={save}
      />
    </main>
  );
}
