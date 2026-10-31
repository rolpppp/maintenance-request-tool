import { Field } from '@/components/Field';
import { Step } from './Step';
import type { StepProps } from './form-state';

export type PropertyOption = { id: string; name: string };
/** Unit numbers only: tenant names never reach the browser. */
export type UnitOption = { id: string; unit_number: string; property_id: string };

export function StepWhere({
  values,
  errors,
  update,
  properties,
  units,
}: StepProps & { properties: PropertyOption[]; units: UnitOption[] }) {
  const propertyUnits = units.filter((u) => u.property_id === values.propertyId);
  return (
    <Step n={1} title="Where is the problem?" reveal={false}>
      <Field id="property" label="Property">
        {(a11y) => (
          <select
            {...a11y}
            name="property"
            className="control"
            value={values.propertyId}
            // A unit belongs to one property, so changing the property clears the unit.
            onChange={(e) => update({ propertyId: e.target.value, unitId: '' })}
          >
            <option value="" disabled>
              Choose a property
            </option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field id="unit" label="Unit" error={errors.unitId}>
        {(a11y) => (
          <select
            {...a11y}
            name="unit"
            className="control"
            value={values.unitId}
            disabled={!values.propertyId}
            onChange={(e) => update({ unitId: e.target.value })}
          >
            <option value="" disabled>
              {values.propertyId ? 'Choose a unit' : 'Choose a property first'}
            </option>
            {propertyUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unit_number}
              </option>
            ))}
          </select>
        )}
      </Field>
    </Step>
  );
}
