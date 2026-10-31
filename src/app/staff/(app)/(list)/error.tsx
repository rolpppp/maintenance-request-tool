'use client';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/dashboard/EmptyState';

export default function DashboardError({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto max-w-[1200px] px-4 pt-8 pb-16">
      <EmptyState
        title="Couldn't load requests"
        action={
          <Button variant="ghost" className="h-10" onClick={() => retry()}>
            Try again
          </Button>
        }
      >
        Check your connection. Nothing was lost.
      </EmptyState>
    </main>
  );
}
