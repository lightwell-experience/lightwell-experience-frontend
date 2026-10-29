import { EmptyState, type EmptyStateProps } from '@patternfly/react-core';

import {
  getLwEmptyStateDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './empty-state.css';

/** Owned slots + PF `EmptyState` passthrough — `className` / rest merge onto the EmptyState root. */
export type LwEmptyStateProps = {
  // Lightwell-specific props land here as they are decided.
} & EmptyStateProps;

/**
 * Kit **primitive** — configured PF `EmptyState` **root only**.
 * Footer / Actions / Body stay call-site composition (PF subcomponents as children).
 * Defaults live in `components.config.ts` → `componentsConfig.emptyState`.
 */
export function LwEmptyState({ className, ...rest }: LwEmptyStateProps) {
  const emptyStateProps = mergeComponentProps(getLwEmptyStateDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-empty-state', className),
  });
  return <EmptyState {...emptyStateProps} />;
}

export default LwEmptyState;
