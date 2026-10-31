/** What a staff save returns. `message` completes the toast: "Saved · {message}". No error detail reaches the browser. */
export type ActionResult = { ok: true; message: string } | { ok: false };
