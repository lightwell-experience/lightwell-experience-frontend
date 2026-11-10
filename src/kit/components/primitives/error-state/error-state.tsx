import ErrorState, {
  type ErrorStateProps,
} from '@redhat-cloud-services/frontend-components/ErrorState';

import {
  getLwErrorStateDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './error-state.css';

/** Owned slots + `ErrorState` passthrough — `className` / rest merge onto the root. */
export type LwErrorStateProps = ErrorStateProps;

/**
 * Kit **primitive** — configured `ErrorState` **root only**.
 * Defaults live in `components.config.ts` → `componentsConfig.errorState`.
 */
export function LwErrorState({ className, ...rest }: LwErrorStateProps) {
  const errorStateProps = mergeComponentProps(getLwErrorStateDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-error-state', className),
  });
  return <ErrorState {...errorStateProps} />;
}

export default LwErrorState;
