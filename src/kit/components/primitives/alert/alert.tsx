import { Alert, type AlertProps } from '@patternfly/react-core';

import {
  getLwAlertDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './alert.css';

/**
 * Owned slots + PF `Alert` passthrough — `className` / `style` / rest merge onto the host.
 * `title` is optional at the call site when config supplies the Lightwell baseline.
 * Lightwell-specific props land in the leading object as they are decided.
 */
export type LwAlertProps = {
  // Lightwell-specific props land here as they are decided.
} & Omit<AlertProps, 'title'> & { title?: AlertProps['title'] };

/**
 * Kit **primitive** — configured PF `Alert`.
 * Logic harness, not a DOM wrap: root = `Alert`.
 * Defaults (sensitive-data warning baseline) live in `componentsConfig.alert`.
 * Presentational overrides → `alert.css`.
 */
export function LwAlert({ className, title, ...rest }: LwAlertProps) {
  const defaults = getLwAlertDefaults();
  const alertProps = mergeComponentProps<AlertProps>(defaults, {
    ...rest,
    title: title ?? defaults.title ?? '',
    className: mergeClassNames('lw-c-alert', className),
  });
  return <Alert {...alertProps} />;
}

export default LwAlert;
