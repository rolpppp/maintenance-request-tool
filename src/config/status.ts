/** Status labels and pill colours. Values match the `request_status` enum. */

export type RequestStatus = 'new' | 'scheduled' | 'waiting_on_vendor' | 'done';

export const STATUS_ORDER: RequestStatus[] = ['new', 'scheduled', 'waiting_on_vendor', 'done'];

export const STATUS_META: Record<RequestStatus, { label: string; pill: string; dot: string }> = {
  new: { label: 'New', pill: 'bg-status-new-bg text-status-new-fg', dot: 'bg-status-new-dot' },
  scheduled: { label: 'Scheduled', pill: 'bg-status-scheduled-bg text-status-scheduled-fg', dot: 'bg-status-scheduled-dot' },
  waiting_on_vendor: { label: 'Waiting on vendor', pill: 'bg-status-waiting-bg text-status-waiting-fg', dot: 'bg-status-waiting-dot' },
  done: { label: 'Done', pill: 'bg-status-done-bg text-status-done-fg', dot: 'bg-status-done-dot' },
};

/** Dashboard grouping (HANDOFF §5.4). */
export type DashboardGroup = 'attention' | 'progress' | 'done';

export function dashboardGroup(status: RequestStatus, openDays: number, agingDays = 3): DashboardGroup {
  if (status === 'done') return 'done';
  if (status === 'new' || openDays >= agingDays) return 'attention';
  return 'progress';
}
