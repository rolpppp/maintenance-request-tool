'use client';

import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { FieldError } from '@/components/Field';
import { MAX_PHOTOS, photoError } from '@/lib/photos';
import type { Photo } from './form-state';

/**
 * Controlled by the form, which owns the preview URLs: it revokes them on unmount,
 * and this component revokes the one it drops when a photo is removed.
 */
export function PhotoPicker({ photos, onChange }: { photos: Photo[]; onChange: (photos: Photo[]) => void }) {
  const [error, setError] = useState<string | null>(null);

  function add(files: FileList | null) {
    const added: Photo[] = [];
    let problem: string | null = null;
    for (const file of Array.from(files ?? [])) {
      if (photos.length + added.length >= MAX_PHOTOS) {
        problem = `You can add up to ${MAX_PHOTOS} photos.`;
        break;
      }
      const fileProblem = photoError(file);
      if (fileProblem) problem = fileProblem;
      else added.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) });
    }
    setError(problem);
    if (added.length) onChange([...photos, ...added]);
  }

  function remove(photo: Photo) {
    URL.revokeObjectURL(photo.url);
    setError(null);
    onChange(photos.filter((p) => p.id !== photo.id));
  }

  return (
    <fieldset>
      <legend className="mb-1.5 text-[15px] font-semibold">
        Photos<span className="font-normal text-muted"> · optional, up to {MAX_PHOTOS}</span>
      </legend>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, i) => (
          <div key={photo.id} className="motion-thumb relative aspect-square overflow-hidden rounded-control bg-fill">
            {/* A blob: URL preview of the tenant's own file; next/image can't optimise it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => remove(photo)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-0 right-0 grid size-11 place-items-start justify-items-end p-1.5"
            >
              <span className="grid size-6 place-items-center rounded-full bg-ink/80 text-white">
                <X size={14} aria-hidden="true" />
              </span>
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-control border border-dashed border-field text-sm font-semibold text-ink-2 hover:border-field-hover has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
            <Camera size={22} aria-hidden="true" />
            Add photo
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                add(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
      <p className="mt-1.5 text-sm text-muted">A close-up and one wider shot help the team bring the right parts.</p>
      <div aria-live="polite">{error && <FieldError>{error}</FieldError>}</div>
    </fieldset>
  );
}
