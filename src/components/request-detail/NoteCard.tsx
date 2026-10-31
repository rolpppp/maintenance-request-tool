'use client';

import { useState, useTransition } from 'react';
import { addNote } from '@/app/staff/actions';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useSave } from '@/components/Toast';

export function NoteCard({ requestId }: { requestId: string }) {
  const save = useSave();
  const [note, setNote] = useState('');
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      // Keep the text if the save fails, so nothing typed is lost.
      if (await save(() => addNote(requestId, note))) setNote('');
    });
  }

  return (
    <Card title="Internal note">
      <textarea
        aria-label="Internal note"
        aria-describedby="note-hint"
        className="control text-base"
        maxLength={4000}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <p id="note-hint" className="mt-1.5 text-sm text-muted">
        Visible to staff only. Tenants never see notes.
      </p>
      <Button className="mt-3 h-10" disabled={note.trim() === ''} pending={pending} pendingLabel="Adding…" onClick={add}>
        Add note
      </Button>
    </Card>
  );
}
