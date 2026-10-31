import { ToastProvider } from '@/components/Toast';
import { StaffHeader } from '@/components/staff/StaffHeader';
import { requireStaff } from '@/lib/auth';

// Every page in this route group needs a signed-in staff member. The login page lives outside it.
export default async function StaffAppLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requireStaff();
  return (
    <ToastProvider>
      <StaffHeader name={staff.displayName} />
      {children}
    </ToastProvider>
  );
}
