/** Read a required env var when it is used, not at import, so `next build` works without .env.local. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}
