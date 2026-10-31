'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Spinner } from '@/components/Spinner';
import type { ActionResult } from '@/lib/action-result';

type Save = (action: () => Promise<ActionResult>) => Promise<boolean>;
type Toast = { kind: 'saving' } | { kind: 'saved'; message: string } | { kind: 'error'; retry: () => void };

const SaveContext = createContext<Save | null>(null);

/**
 * Runs a staff save and reports it: "Saving…", then "Saved · {message}" (gone after 2.2 s) or
 * "Couldn't save. Nothing changed." with a Try again button that runs the same save once more.
 * Resolves to whether it worked, so the caller can clear a form or put an input back.
 */
export function useSave(): Save {
  const save = useContext(SaveContext);
  if (!save) throw new Error('useSave needs a ToastProvider');
  return save;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const hideTimer = useRef<number>(0);

  const save = useCallback<Save>(async function run(action) {
    window.clearTimeout(hideTimer.current);
    setToast({ kind: 'saving' });
    // A thrown action (network down) is a failed save like any other.
    const result = await action().catch((): ActionResult => ({ ok: false }));
    if (result.ok) {
      setToast({ kind: 'saved', message: result.message });
      hideTimer.current = window.setTimeout(() => setToast(null), 2200);
    } else {
      setToast({ kind: 'error', retry: () => void run(action) });
    }
    return result.ok;
  }, []);

  return (
    <SaveContext value={save}>
      {children}
      {/* The live region is always in the page, so screen readers announce what appears in it. */}
      <div role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <p
            className={`motion-toast pointer-events-auto flex items-center gap-3 rounded-control px-4 py-3 text-sm font-medium text-white shadow-toast ${toast.kind === 'error' ? 'bg-danger-hover' : 'bg-ink'}`}
          >
            {toast.kind === 'saving' && (
              <>
                <Spinner />
                Saving…
              </>
            )}
            {toast.kind === 'saved' && (
              <>
                <Check size={16} className="text-accent-line" aria-hidden="true" />
                Saved · {toast.message}
              </>
            )}
            {toast.kind === 'error' && (
              <>
                Couldn&apos;t save. Nothing changed.
                <button type="button" onClick={toast.retry} className="font-semibold underline underline-offset-2">
                  Try again
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </SaveContext>
  );
}
