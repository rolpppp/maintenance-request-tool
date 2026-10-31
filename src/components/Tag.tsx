/** The maintenance tag (MR-4K7Q). The punched hole is drawn by `.tag::before` in tokens.css. */
export function Tag({ value, large = false }: { value: string; large?: boolean }) {
  return <span className={large ? 'tag tag-lg' : 'tag'}>{value}</span>;
}
