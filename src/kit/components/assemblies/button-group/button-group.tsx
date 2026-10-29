import type { HTMLAttributes, ReactNode } from 'react';

import {
  getLwButtonGroupDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './button-group.css';

type LwButtonGroupOwnedProps = {
  /**
   * Call-site owns the controls. Pass N `LwButton` / `LwMenu` / … —
   * this assembly does not invent product-shaped slots.
   */
  children?: ReactNode;
};

/** Layout host — children passthrough; paint in `button-group.css`. */
export type LwButtonGroupProps = LwButtonGroupOwnedProps &
  Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

/**
 * Kit **assembly** — row of button-like controls.
 * Layout only: gap / alignment in CSS. No domain wiring.
 */
export function LwButtonGroup({ children, className, ...rest }: LwButtonGroupProps) {
  const props = mergeComponentProps(getLwButtonGroupDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-button-group', className),
  });

  return <div {...props}>{children}</div>;
}

export default LwButtonGroup;
