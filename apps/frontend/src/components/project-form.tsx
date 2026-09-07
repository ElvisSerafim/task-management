'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/modal';
import type { Project } from '@/hooks/use-projects';
import { projectSchema } from '@/lib/schemas';

export function ProjectForm({
  open,
  project,
  onClose,
  onSubmit,
}: {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSubmit: (title: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: project?.title ?? '' },
  });

  return (
    <Modal
      open={open}
      title={project ? 'Edit project' : 'New project'}
      onClose={onClose}
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit(({ title }) => onSubmit(title))}
      >
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input
            className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700"
            {...register('title')}
          />
          {errors.title ? (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          ) : null}
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
