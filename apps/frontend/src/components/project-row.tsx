'use client';

import Link from 'next/link';
import type { Project } from '@/hooks/use-projects';

export function ProjectRow({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-2 py-3">
      <Link
        href={`/projects/${project.id}`}
        className="flex-1 font-medium tracking-tight hover:underline"
      >
        {project.title}
      </Link>
      <button
        className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        onClick={onEdit}
      >
        Edit
      </button>
      <button
        className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        onClick={onDelete}
      >
        Delete
      </button>
    </li>
  );
}
