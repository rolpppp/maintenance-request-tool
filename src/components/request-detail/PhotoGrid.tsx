'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Card } from '@/components/Card';
import { PhotoViewer } from '@/components/request-detail/PhotoViewer';
import type { RequestPhoto } from '@/lib/staff-requests';

export function PhotoGrid({ photos, heading, where }: { photos: RequestPhoto[]; heading: string; where: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Card title={`Photos · ${photos.length}`}>
      {photos.length === 0 ? (
        <p className="text-sm text-muted">No photos attached.</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-3">
            {photos.map((photo, i) => (
              <li key={photo.id}>
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={`Open photo ${i + 1} of ${photos.length}`}
                  className="block overflow-hidden rounded-chip border border-line hover:border-line-strong"
                >
                  {/* A short-lived signed URL, so next/image's optimiser has nothing to add. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" width={168} height={126} className="h-[126px] w-[168px] object-cover" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-muted">
            <Lock size={13} aria-hidden="true" />
            Private. Shown only to signed-in staff through links that expire in a few minutes.
          </p>
          <PhotoViewer photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} heading={heading} where={where} />
        </>
      )}
    </Card>
  );
}
