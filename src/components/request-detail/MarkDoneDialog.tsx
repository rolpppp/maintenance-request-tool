'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/Button';
import { Dialog, DialogFooter } from '@/components/Dialog';
import { Tag } from '@/components/Tag';
import { STATUS_META, type RequestStatus } from '@/config/status';

export type DoneSummary = { ref: string; title: string; where: string };

type Props = {
  open: boolean;
  from: RequestStatus;
  summary: DoneSummary;
  pending: boolean;
  onConfirm: (note: string) => void;
  onClose: () => void;
};

/** Closed while `open` is false. The content is mounted per opening, so the note starts empty each time. */
export function MarkDoneDialog({ open, onClose, ...rest }: Props) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="mark-done-title" describedBy="mark-done-desc">
      {open && <Content onClose={onClose} {...rest} />}
    </Dialog>
  );
}

function Content({ from, summary, pending, onConfirm, onClose }: Omit<Props, 'open'>) {
  const [note, setNote] = useState('');

  return (
    <>
      <div className="p-5 pt-4 sm:pt-5">
        <span className="grid size-10 place-items-center rounded-full bg-accent-tint text-accent">
          <Check size={20} aria-hidden="true" />
        </span>
        <h2 id="mark-done-title" className="mt-3 text-lg font-[650] tracking-[-0.012em]">
          Mark as Done?
        </h2>
        <p id="mark-done-desc" className="mt-1 text-muted">
          This closes the request. You can reopen it any time.
        </p>
        <div className="mt-4 rounded-chip border border-line-soft bg-panel px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Tag value={summary.ref} />
            <span className="font-semibold">{summary.title}</span>
          </div>
          <p className="mt-1 text-muted">
            {summary.where} · {STATUS_META[from].label} → Done
          </p>
        </div>
        <label htmlFor="mark-done-note" className="mt-4 block text-sm font-semibold">
          What was done? <span className="font-normal text-muted">· optional, staff only</span>
        </label>
        <textarea
          id="mark-done-note"
          className="control mt-1.5 text-base"
          maxLength={4000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-keyshortcuts="Control+Enter Meta+Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !pending) onConfirm(note);
          }}
        />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button pending={pending} pendingLabel="Saving…" onClick={() => onConfirm(note)}>
          Mark as Done
        </Button>
      </DialogFooter>
    </>
  );
}
