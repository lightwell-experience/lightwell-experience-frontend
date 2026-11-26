import { ToggleGroup, ToggleGroupItem, type ToggleGroupProps } from '@patternfly/react-core';
import type { ReactNode } from 'react';

import {
  getLwToggleGroupDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './toggle-group.css';

/** One option when using slot-build `items` (not children passthrough). */
export type LwToggleGroupItem = {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  isDisabled?: boolean;
};

type LwToggleGroupOwnedProps = {
  /**
   * Slot build: option descriptors → `ToggleGroupItem`s, single-select against `value`.
   * Ignored when `children` is provided (passthrough wins).
   */
  items?: LwToggleGroupItem[];
  /** Selected option's `value`. Required with `items`; ignored with `children`. */
  value?: string;
  /** Fires with the newly selected option's `value`. Required with `items`. */
  onChange?: (value: string) => void;
  /**
   * Passthrough: caller owns the interior (`ToggleGroupItem`s, multi-select wiring, …).
   * Wins over `items`.
   */
  children?: ReactNode;
};

/** Owned slots + PF `ToggleGroup` passthrough. `children` may be caller-owned. */
export type LwToggleGroupProps = LwToggleGroupOwnedProps & Omit<ToggleGroupProps, 'children'>;

/**
 * Kit **primitive** — configured PF `ToggleGroup`.
 *
 * One base unit: host = `ToggleGroup`; `ToggleGroupItem` stays inside the harness
 * (ToggleGroup's own child contract), not a second primitive.
 *
 * Cascade for interior:
 *   1. `children` → passthrough
 *   2. `items` + `value` / `onChange` → single-select `ToggleGroupItem`s
 *   3. neither → empty group shell
 *
 * `ToggleGroupItem` already renders `aria-pressed` + selected styling on its own
 * `button` — do not reimplement that with `LwButton` `variant` / `aria-pressed`.
 */
export function LwToggleGroup({
  items,
  value,
  onChange,
  children,
  className,
  ...rest
}: LwToggleGroupProps) {
  const toggleGroupProps = mergeComponentProps(getLwToggleGroupDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-toggle-group', className),
  });

  let interior: ReactNode = null;
  if (children) {
    interior = children;
  } else if (items?.length) {
    interior = items.map((item) => (
      <ToggleGroupItem
        key={item.value}
        text={item.label}
        icon={item.icon}
        isDisabled={item.isDisabled}
        isSelected={item.value === value}
        onChange={() => onChange?.(item.value)}
      />
    ));
  }

  return <ToggleGroup {...toggleGroupProps}>{interior}</ToggleGroup>;
}

export default LwToggleGroup;
