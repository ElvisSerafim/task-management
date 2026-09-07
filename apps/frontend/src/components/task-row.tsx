'use client';

import type { Task } from '@/hooks/use-tasks';

function dateInputValue(dueDate: string | null) {
  return dueDate ? dueDate.slice(0, 10) : '';
}

export function TaskRow({
  task,
  onComplete,
  onEdit,
  onDelete,
}: {
  task: Task;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = task.finishedAt !== null;
  return (
    <li className="flex items-center gap-3 py-3">
      <input
        type="checkbox"
        className="size-4 rounded border-zinc-300 accent-zinc-900 dark:border-zinc-600"
        checked={done}
        disabled={done}
        onChange={() => {
          if (!done) onComplete();
        }}
      />
      <div className="min-w-0 flex-1">
        <p className={done ? 'text-zinc-400 line-through' : 'font-medium tracking-tight'}>
          {task.description}
        </p>
        {task.dueDate ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
            Due date
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {dateInputValue(task.dueDate)}
            </span>
          </p>
        ) : null}
      </div>
      {done ? null : (
        <>
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
        </>
      )}
    </li>
  );
}
