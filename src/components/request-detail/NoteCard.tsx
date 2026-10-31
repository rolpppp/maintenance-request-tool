import { Card } from '@/components/Card';

/** Placeholder; task 3.4 adds the textarea and "Add note". Notes already show in Activity. */
export function NoteCard() {
  return (
    <Card title="Internal note">
      <p className="text-sm text-muted">Visible to staff only. Tenants never see notes.</p>
    </Card>
  );
}
