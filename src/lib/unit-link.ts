import { z } from 'zod';

/**
 * The unit id from a `/?unit=<uuid>` link, only if it is a uuid and one of the units we loaded.
 * Anything else is ignored silently, so the link reveals nothing about which ids exist.
 */
export function linkedUnitId(param: string | string[] | undefined, units: { id: string }[]): string | undefined {
  const parsed = z.uuid().safeParse(param);
  return parsed.success && units.some((u) => u.id === parsed.data) ? parsed.data : undefined;
}
