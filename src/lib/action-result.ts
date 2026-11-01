/**
 * What a staff save returns. On success `message` completes the toast: "Saved · {message}". A failure
 * carries a `message` only when the input was rejected and the staff member can fix it ("Choose today
 * or a later date."); database and network errors stay generic and no error detail reaches the browser.
 */
export type ActionResult = { ok: true; message: string } | { ok: false; message?: string };
