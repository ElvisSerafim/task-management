'use client';

import { useState } from 'react';
import { errMessage } from '@/lib/errors';
import { ProjectForm } from '@/components/project-form';
import { ProjectRow } from '@/components/project-row';
import { LogoutButton } from '@/components/logout-button';
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
  type Project,
} from '@/hooks/use-projects';

export default function ProjectsPage() {
  const { data: projects = [], error } = useProjects();
  const create = useCreateProject();
  const update = useUpdateProject();
  const remove = useDeleteProject();
  const [modal, setModal] = useState<'create' | Project | null>(null);

  async function save(title: string) {
    try {
      if (modal === 'create') await create.mutateAsync(title);
      else if (modal) await update.mutateAsync({ id: modal.id, title });
      setModal(null);
    } catch {
      /* toast in onError; keep modal open */
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <LogoutButton />
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <button
            className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            onClick={() => setModal('create')}
          >
            New project
          </button>
        </div>
        {error ? <p className="mb-3 text-sm text-red-600">{errMessage(error)}</p> : null}
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {projects.map((p) => (
            <ProjectRow
              key={p.id}
              project={p}
              onEdit={() => setModal(p)}
              onDelete={() => remove.mutate(p.id)}
            />
          ))}
        </ul>
      </div>
      <ProjectForm
        key={modal === null ? 'closed' : modal === 'create' ? 'create' : modal.id}
        open={modal !== null}
        project={modal === 'create' || modal === null ? null : modal}
        onClose={() => setModal(null)}
        onSubmit={save}
      />
    </main>
  );
}
