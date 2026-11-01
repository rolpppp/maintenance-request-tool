/**
 * Everything category-specific lives here: labels, hints, quick checks,
 * follow-up questions and which answers count as emergencies.
 * Change a question = edit this file only. Ids match the `request_category` enum.
 */

export type CategoryId =
  | 'ac_heating'
  | 'plumbing'
  | 'electrical'
  | 'pest'
  | 'appliance'
  | 'door_lock'
  | 'other';

export type FollowUpOption = {
  label: string;
  /** Picking this shows the inline "Call now" prompt and sets emergency_flag. */
  emergency?: boolean;
};

export type FollowUpQuestion = {
  /** Stable key stored in requests.answers. Never reuse a key for a different question. */
  key: string;
  question: string;
  optional?: boolean;
  options: FollowUpOption[];
};

export type Category = {
  id: CategoryId;
  label: string;
  hint: string;
  /** lucide-react icon name, used on every screen (HANDOFF §4.3). */
  icon: 'Thermometer' | 'Droplet' | 'Zap' | 'Bug' | 'WashingMachine' | 'KeyRound' | 'Ellipsis';
  /** Steps shown under "Try this first". Omit for categories without a self-check. */
  quickCheck?: string[];
  /** Text in the inline emergency prompt when an emergency answer is picked. */
  emergencyText?: string;
  questions: FollowUpQuestion[];
};

/** Owner decision: no AC above 90°F inside is an emergency. */
export const EXTREME_HEAT_F = 90;

export const CATEGORIES: Category[] = [
  {
    id: 'ac_heating',
    label: 'AC / heating',
    hint: 'No cool air, no heat, thermostat',
    icon: 'Thermometer',
    quickCheck: [
      'Set the thermostat to Cool, a few degrees below the room temperature.',
      'Check the breaker panel. If the AC switch is off or stuck in the middle, flip it fully off, then on.',
    ],
    emergencyText: `No AC with the inside temperature over ${EXTREME_HEAT_F}°F is dangerous. Please call instead of waiting for the form.`,
    questions: [
      {
        key: 'symptom',
        question: 'What’s happening?',
        options: [
          { label: 'Blowing warm air' },
          { label: 'Not turning on' },
          { label: 'Leaking water' },
          { label: 'Making a noise' },
        ],
      },
      {
        key: 'over_90f',
        question: `Is it over ${EXTREME_HEAT_F}°F inside right now?`,
        options: [{ label: 'Yes', emergency: true }, { label: 'No' }, { label: 'Not sure' }],
      },
      {
        key: 'filter_changed',
        question: 'When did you last change the filter?',
        optional: true,
        options: [
          { label: 'This month' },
          { label: '1–3 months ago' },
          { label: 'Over 3 months' },
          { label: 'Not sure' },
        ],
      },
    ],
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    hint: 'Leaks, clogs, toilet, hot water',
    icon: 'Droplet',
    emergencyText: 'Water spreading onto the floor can damage your unit and the ones nearby. Call now.',
    questions: [
      {
        key: 'problem',
        question: 'What’s the problem?',
        options: [
          { label: 'Leak or drip' },
          { label: 'Clogged drain' },
          { label: 'Toilet problem' },
          { label: 'No hot water' },
        ],
      },
      {
        key: 'water_spreading',
        question: 'Is water spreading onto the floor?',
        options: [{ label: 'Yes', emergency: true }, { label: 'No' }],
      },
    ],
  },
  {
    id: 'electrical',
    label: 'Electrical',
    hint: 'Outlets, switches, lights',
    icon: 'Zap',
    quickCheck: [
      'Press RESET on any outlet with two buttons (often in the kitchen, bathroom or garage).',
      'Check the breaker panel. Flip any switch stuck in the middle fully off, then on.',
    ],
    emergencyText: 'A burning smell or sparks is a fire risk. Don’t touch it, and call now.',
    questions: [
      {
        key: 'affected',
        question: 'What’s affected?',
        options: [
          { label: 'One outlet or switch' },
          { label: 'A whole room' },
          { label: 'Lights flickering' },
          { label: 'Burning smell or sparks', emergency: true },
        ],
      },
    ],
  },
  {
    id: 'pest',
    label: 'Pests',
    hint: 'Ants, roaches, mice, bed bugs',
    icon: 'Bug',
    questions: [
      {
        key: 'pest_type',
        question: 'What are you seeing?',
        options: [
          { label: 'Ants' },
          { label: 'Roaches' },
          { label: 'Mice or rats' },
          { label: 'Bed bugs' },
          { label: 'Something else' },
        ],
      },
      {
        key: 'where',
        question: 'Where?',
        options: [{ label: 'Kitchen' }, { label: 'Bathroom' }, { label: 'Bedroom' }, { label: 'All over' }],
      },
    ],
  },
  {
    id: 'appliance',
    label: 'Appliance',
    hint: 'Fridge, stove, dishwasher, washer',
    icon: 'WashingMachine',
    quickCheck: [
      'Make sure it’s plugged in and the outlet works (try a phone charger).',
      'Check the breaker panel for a tripped switch.',
    ],
    questions: [
      {
        key: 'appliance',
        question: 'Which appliance?',
        options: [
          { label: 'Fridge' },
          { label: 'Stove or oven' },
          { label: 'Dishwasher' },
          { label: 'Washer or dryer' },
          { label: 'Other' },
        ],
      },
    ],
  },
  {
    id: 'door_lock',
    label: 'Door / lock',
    hint: 'Won’t lock, won’t open, keys',
    icon: 'KeyRound',
    quickCheck: [
      'If it’s a keypad lock, replace the batteries.',
      'Try the key while gently pushing or pulling the door.',
    ],
    questions: [
      {
        key: 'problem',
        question: 'What’s wrong?',
        options: [
          { label: 'Won’t lock' },
          { label: 'Won’t open' },
          { label: 'Key broken or stuck' },
          { label: 'Keypad not working' },
        ],
      },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    hint: 'Walls, windows, ceilings, anything else',
    icon: 'Ellipsis',
    questions: [],
  },
];

export const CATEGORY_BY_ID: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;

/** Server-side check: keep only known questions and options. */
export function sanitizeAnswers(categoryId: CategoryId, raw: Record<string, unknown>) {
  const category = CATEGORY_BY_ID[categoryId];
  const answers: Record<string, string> = {};
  let emergency = false;
  for (const q of category.questions) {
    const value = raw[q.key];
    if (typeof value !== 'string') continue;
    const option = q.options.find((o) => o.label === value);
    if (!option) continue;
    answers[q.key] = option.label;
    if (option.emergency) emergency = true;
  }
  return { answers, emergency };
}
