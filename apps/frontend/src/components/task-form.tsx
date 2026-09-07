'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/modal';
import type { Task } from '@/hooks/use-tasks';
import { taskSchema, todayIso } from '@/lib/schemas';

function dateInputValue(dueDate: string | null) {
  return dueDate ? dueDate.slice(0, 10) : '';
}

export function TaskForm({
  open,
  task,
  onClose,
  onSubmit,
}: {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: (values: { description: string; dueDate: string }) => void;
}) {
  const minDate = todayIso();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      taskSchema(minDate, task ? dateInputValue(task.dueDate) : undefined),
    ),
    defaultValues: {
      description: task?.description ?? '',
      dueDate: dateInputValue(task?.dueDate ?? null),
    },
  });

  return (
    <Modal open={open} title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit((values) => onSubmit(values))}
      >
        <label className="flex flex-col gap-1 text-sm">
          Description
          <input
            className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700"
            {...register('description')}
          />
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          ) : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Due date
          <input
            className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700"
            type="date"
            min={minDate}
            {...register('dueDate')}
          />
          {errors.dueDate ? (
            <p className="text-sm text-red-600">{errors.dueDate.message}</p>
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
