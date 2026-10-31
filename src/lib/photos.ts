/** Photo rules, shared by the photo picker and the server action (the server is the one that counts). */

export const MAX_PHOTOS = 3;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** Allowed MIME types and the file extension we store them under. Matches the bucket and table checks. */
export const PHOTO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export function photoError(file: { type: string; size: number }): string | null {
  if (!(file.type in PHOTO_EXTENSIONS)) return "That file isn't a photo. Choose a JPG, PNG or HEIC image.";
  if (file.size > MAX_PHOTO_BYTES) return 'That photo is over 10 MB. Try a smaller one.';
  return null;
}
