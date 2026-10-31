import { Lock } from 'lucide-react';
import { Card } from '@/components/Card';
import type { RequestPhoto } from '@/lib/staff-requests';

/** Thumbnails link to the full photo for now; the viewer dialog is task 3.6. */
export function PhotoGrid({ photos }: { photos: RequestPhoto[] }) {
  return (
    <Card title={`Photos · ${photos.length}`}>
      {photos.length === 0 ? (
        <p className="text-sm text-muted">No photos attached.</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-3">
            {photos.map((photo, i) => (
              <li key={photo.id}>
                <a href={photo.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-chip border border-line hover:border-line-strong">
                  {/* A short-lived signed URL, so next/image's optimiser has nothing to add. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={`Photo ${i + 1} of ${photos.length}`} width={168} height={126} className="h-[126px] w-[168px] object-cover" />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-muted">
            <Lock size={13} aria-hidden="true" />
            Private. Shown only to signed-in staff through links that expire in a few minutes.
          </p>
        </>
      )}
    </Card>
  );
}
