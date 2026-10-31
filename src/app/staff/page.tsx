import { requireStaff } from "@/lib/auth";

export default async function StaffDashboardPage() {
  await requireStaff();
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8">
      <h1 className="text-[28px] leading-[1.15] font-bold tracking-[-0.025em]">Requests</h1>
    </main>
  );
}
