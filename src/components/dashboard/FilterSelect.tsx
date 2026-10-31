'use client';

/** A select that applies itself: picking an option submits the surrounding GET form. */
export function FilterSelect({ name, label, options, value }: { name: string; label: string; options: { value: string; label: string }[]; value: string }) {
  return (
    <label className="block text-[13px] font-semibold">
      {label}
      <select
        name={name}
        defaultValue={value}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="control mt-1 block h-10 text-sm font-normal"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
