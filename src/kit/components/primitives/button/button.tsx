import { Button, type ButtonProps } from '@patternfly/react-core';

import {
  getLwButtonDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './button.css';

/** Owned slots + PF `Button` passthrough — `className` / `style` / rest merge onto the Button root. */
export type LwButtonProps = {
  // Lightwell-specific props land here (e.g. `intent` mapping) as they are decided.
} & ButtonProps;

/**
 * Kit **primitive** — configured PF `Button`.
 * Logic harness, not a DOM wrap: root = `Button`; call-site props win via mergeComponentProps.
 * Defaults live in `components.config.ts` → `componentsConfig.button`.
 *
 * Circle icon-help: pass PF `isCircle` (→ `pf-m-circle`). Do not invent a Lightwell twin
 * or product CSS (e.g. `lightwell-help-btn`). Prefer `LwTooltip` / `LwPopover` + this host.
 */
export function LwButton({ className, ...rest }: LwButtonProps) {
  const buttonProps = mergeComponentProps(getLwButtonDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-button', className),
  });
  return <Button {...buttonProps} />;
}

export default LwButton;
