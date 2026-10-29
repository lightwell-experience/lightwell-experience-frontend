import { Checkbox, type CheckboxProps } from '@patternfly/react-core';

import {
  getLwCheckboxDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './checkbox.css';

/**
 * Owned slots + PF `Checkbox` passthrough — `className` / `style` / rest merge onto the Checkbox root.
 * `ref` is omitted: PF types it to `HTMLInputElement` while the `Checkbox` class component's JSX
 * ref is `Checkbox`, and this primitive does not forward a ref.
 */
export type LwCheckboxProps = Omit<CheckboxProps, 'ref'>;

/**
 * Kit **primitive** — configured PF `Checkbox` (controlled).
 * Logic harness, not a DOM wrap: root = `Checkbox`; call-site props win via mergeComponentProps.
 * Defaults live in `components.config.ts` → `componentsConfig.checkbox`.
 *
 * PF `Checkbox` in controlled mode requires `id`, `isChecked`, and `onChange`.
 */
export function LwCheckbox({ className, ...rest }: LwCheckboxProps) {
  const checkboxProps = mergeComponentProps<LwCheckboxProps>(getLwCheckboxDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-checkbox', className),
  });
  return <Checkbox {...checkboxProps} />;
}

export default LwCheckbox;
