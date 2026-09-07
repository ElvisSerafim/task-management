'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="fixed left-1/2 top-1/2 m-0 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-5 text-foreground shadow-xl backdrop:bg-zinc-950/40 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </dialog>
  );
}
