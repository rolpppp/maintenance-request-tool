import { CATEGORIES, CATEGORY_BY_ID, type Category } from '@/config/categories';
import { CallButton } from '@/components/CallButton';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Step } from './Step';
import { QuickCheck } from './QuickCheck';
import { RadioCard } from './RadioCard';
import type { StepProps } from './form-state';

type Phone = { display: string; tel: string };

/** Everything in this step is driven by categories.ts. Changing the category clears the answers and the quick check. */
export function StepProblem({ values, update, phone, staff }: StepProps & { phone: Phone; staff: boolean }) {
  const category = values.category ? CATEGORY_BY_ID[values.category] : null;
  const showFollowUps = category && (staff || !category.quickCheck || values.quickCheck === 'still_broken');

  return (
    <Step n={3} title="What's wrong?">
      <fieldset aria-labelledby="step-3-title" className="space-y-2">
        {CATEGORIES.map((c) => (
          <RadioCard
            key={c.id}
            name="category"
            value={c.id}
            indicator="check"
            checked={values.category === c.id}
            onChange={() => update({ category: c.id, quickCheck: 'unanswered', answers: {} })}
          >
            <span className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-chip bg-fill">
                <CategoryIcon category={c.id} />
              </span>
              <span>
                <span className="block font-semibold">{c.label}</span>
                <span className="block text-sm text-muted">{c.hint}</span>
              </span>
            </span>
          </RadioCard>
        ))}
      </fieldset>

      {category?.quickCheck && !staff && (
        <QuickCheck steps={category.quickCheck} state={values.quickCheck} onChange={(quickCheck) => update({ quickCheck })} />
      )}
      {showFollowUps && <FollowUps category={category} answers={values.answers} update={update} phone={phone} />}
    </Step>
  );
}

function FollowUps({
  category,
  answers,
  update,
  phone,
}: {
  category: Category;
  answers: Record<string, string>;
  update: StepProps['update'];
  phone: Phone;
}) {
  const emergency = category.questions.some((q) => q.options.some((o) => o.emergency && answers[q.key] === o.label));
  return (
    <>
      {category.questions.map((q) => (
        <fieldset key={q.key}>
          <legend className="mb-2 font-semibold">
            {q.question}
            {q.optional && <span className="font-normal text-muted"> · optional</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {q.options.map((o) => (
              <label key={o.label} className="relative">
                <input
                  type="radio"
                  name={`answer-${q.key}`}
                  className="peer sr-only"
                  checked={answers[q.key] === o.label}
                  onChange={() => update({ answers: { ...answers, [q.key]: o.label } })}
                />
                <span
                  className={`flex h-11 cursor-pointer items-center rounded-chip border border-line bg-white px-4 transition-colors duration-150 hover:border-line-strong peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${o.emergency ? 'peer-checked:border-danger peer-checked:bg-danger' : 'peer-checked:border-ink peer-checked:bg-ink'}`}
                >
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {emergency && (
        <div role="alert" className="motion-warn rounded-card border border-danger-line bg-danger-tint p-4">
          <p className="font-semibold text-danger-hover">This is an emergency</p>
          <p className="mt-1 text-danger-hover">{category.emergencyText}</p>
          <CallButton phone={phone} now className="mt-3 w-full" />
        </div>
      )}
    </>
  );
}
