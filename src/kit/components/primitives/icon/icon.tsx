import { Icon, type IconComponentProps } from '@patternfly/react-core';

import {
  getLwIconDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './icon.css';

/** Owned slots + PF `Icon` passthrough — `className` / `style` / rest merge onto the Icon root. */
export type LwIconProps = {
  // Lightwell-specific props land here as they are decided.
} & IconComponentProps;

/**
 * Kit **primitive** — configured PF `Icon`.
 * Logic harness, not a DOM wrap: root = `Icon`.
 * Defaults live in `components.config.ts` → `componentsConfig.icon`.
 * Page-title sizing is a page-assembly concern (`PageTitleStack` passes `size`).
 */
export function LwIcon({ className, ...rest }: LwIconProps) {
  const iconProps = mergeComponentProps(getLwIconDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-icon', className),
  });
  return <Icon {...iconProps} />;
}

export default LwIcon;
