'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  open: boolean;
  /** Called when the dialog closes itself (Escape, backdrop click). The parent then sets `open` to false. */
  onClose: () => void;
  /** Id of the element inside that names the dialog. */
  labelledBy: string;
  describedBy?: string;
  /** `alertdialog` is for destructive confirmations; it ignores clicks on the backdrop. */
  role?: 'dialog' | 'alertdialog';
  /** `photo` is full screen on a dark backdrop. */
  variant?: 'default' | 'photo';
  children: ReactNode;
};

/**
 * A modal on the native <dialog> element: showModal() gives the focus trap, Escape, the top layer and
 * focus returning to the trigger. Layout and motion are in tokens.css (.dialog).
 */
export function Dialog({ open, onClose, labelledBy, describedBy, role = 'dialog', variant = 'default', children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      role={role}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={`dialog ${variant === 'photo' ? 'dialog-photo' : ''}`}
      onClose={onClose}
      // The dialog has no padding, so a click that lands on the dialog itself is a click on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget && role === 'dialog') onClose();
      }}
    >
      {variant === 'default' && <span className="mx-auto mt-2 block h-1 w-9 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />}
      {children}
    </dialog>
  );
}

/** The `hover-row` band under the content. Pass Cancel first, then the main action: phones stack the main action on top. */
export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex flex-col-reverse gap-2 border-t border-line bg-hover-row px-5 py-4 sm:flex-row sm:justify-end">{children}</div>;
}
