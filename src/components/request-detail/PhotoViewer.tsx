'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Download, Lock, X } from 'lucide-react';
import { Dialog } from '@/components/Dialog';
import type { RequestPhoto } from '@/lib/staff-requests';

const SWIPE_PX = 50;

type Props = {
  photos: RequestPhoto[];
  /** Which photo is open; null while closed. */
  index: number | null;
  onIndex: (index: number) => void;
  onClose: () => void;
  /** "MR-4K7Q · AC blowing warm air" */
  heading: string;
  /** "Maple Court · Unit 2B" */
  where: string;
};

/** The links in `photos` were signed on the server; nothing is signed here. */
export function PhotoViewer({ photos, index, onIndex, onClose, heading, where }: Props) {
  const swipeStart = useRef<number | null>(null);
  const photo = index === null ? null : photos[index];

  function go(step: number) {
    if (index === null) return;
    const next = index + step;
    if (next >= 0 && next < photos.length) onIndex(next);
  }

  return (
    <Dialog open={photo !== null} onClose={onClose} labelledBy="viewer-title" variant="photo">
      {photo && index !== null && (
        <div
          className="flex h-full flex-col"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') go(-1);
            if (e.key === 'ArrowRight') go(1);
          }}
        >
          <header className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <h2 id="viewer-title" className="truncate font-semibold">
                {heading}
              </h2>
              <p className="truncate text-sm text-white/80">
                {where} · Photo {index + 1} of {photos.length}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <a href={photo.url} download target="_blank" rel="noreferrer" className={iconButton} aria-label="Download photo">
                <Download size={20} aria-hidden="true" />
              </a>
              <button type="button" onClick={onClose} className={iconButton} aria-label="Close">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div
            className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-4"
            onPointerDown={(e) => (swipeStart.current = e.clientX)}
            onPointerUp={(e) => {
              if (swipeStart.current === null) return;
              const dx = e.clientX - swipeStart.current;
              swipeStart.current = null;
              if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
            }}
          >
            {/* A short-lived signed URL, so next/image's optimiser has nothing to add. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={`Photo ${index + 1} of ${photos.length}`} className="max-h-full max-w-full object-contain select-none" draggable={false} />
            {index > 0 && (
              <button type="button" onClick={() => go(-1)} className={`${iconButton} absolute left-2 max-sm:hidden`} aria-label="Previous photo">
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
            )}
            {index < photos.length - 1 && (
              <button type="button" onClick={() => go(1)} className={`${iconButton} absolute right-2 max-sm:hidden`} aria-label="Next photo">
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            )}
          </div>

          <footer className="px-4 py-3 text-center text-sm text-white/80">
            {photos.length > 1 && (
              <div className="mb-2 flex justify-center gap-1.5 sm:hidden" aria-hidden="true">
                {photos.map((p, i) => (
                  <span key={p.id} className={`size-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/40'}`} />
                ))}
              </div>
            )}
            <p className="flex items-center justify-center gap-1.5">
              <Lock size={13} aria-hidden="true" />
              Private link · expires in 5 minutes
            </p>
          </footer>
        </div>
      )}
    </Dialog>
  );
}

const iconButton = 'grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20';
