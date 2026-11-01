/** A hint for typos in the email domain ("gmial.com"). Never blocks anything; the tenant decides. */

const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'live.com', 'msn.com', 'comcast.net', 'att.net'];
const MAX_DISTANCE = 2;

/** Levenshtein distance: the fewest single-character edits to turn `a` into `b`. */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = row;
  }
  return previous[b.length];
}

/** The full address with a corrected domain, or null when the domain is fine or not close to a common one. */
export function suggestEmail(email: string): string | null {
  const at = email.trim().lastIndexOf('@');
  const address = email.trim();
  const local = address.slice(0, at);
  const domain = address.slice(at + 1).toLowerCase();
  if (at < 1 || domain === '' || COMMON_DOMAINS.includes(domain)) return null;

  // A domain with no dot is missing its ending ("gmail"), so compare it with the names without one.
  const hasTld = domain.includes('.');
  let best: { domain: string; distance: number } | null = null;
  for (const known of COMMON_DOMAINS) {
    const distance = editDistance(domain, hasTld ? known : known.split('.')[0]);
    if (distance <= MAX_DISTANCE && (!best || distance < best.distance)) best = { domain: known, distance };
  }
  return best ? `${local}@${best.domain}` : null;
}
