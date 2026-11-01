import type { CategoryId } from '@/config/categories';
import type { RequestStatus } from '@/config/status';

export type VisitWindow = 'any' | 'morning' | 'afternoon';

/** The request columns both staff screens read. */
export type RequestRow = {
  id: string;
  ref: string;
  contact_name: string;
  tenant_id: string | null;
  /** The linked tenant on file; null when the contact didn't match anyone. */
  tenant: { full_name: string } | null;
  category: CategoryId;
  answers: Record<string, string>;
  description: string;
  status: RequestStatus;
  emergency_flag: boolean;
  vendor_id: string | null;
  visit_date: string | null;
  visit_window: VisitWindow;
  created_at: string;
  closed_at: string | null;
  units: { unit_number: string; properties: { name: string } };
  vendors: { name: string; phone: string | null; is_in_house: boolean } | null;
};
