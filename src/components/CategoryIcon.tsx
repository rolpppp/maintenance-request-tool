import { Bug, Droplet, Ellipsis, KeyRound, Thermometer, WashingMachine, Zap, type LucideIcon } from 'lucide-react';
import { CATEGORY_BY_ID, type Category, type CategoryId } from '@/config/categories';

/** One icon per category, used on every screen (HANDOFF §4.3). The icon names come from categories.ts. */
const ICONS: Record<Category['icon'], LucideIcon> = {
  Thermometer,
  Droplet,
  Zap,
  Bug,
  WashingMachine,
  KeyRound,
  Ellipsis,
};

export function CategoryIcon({ category, size = 20 }: { category: CategoryId; size?: number }) {
  const Icon = ICONS[CATEGORY_BY_ID[category].icon];
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />;
}
