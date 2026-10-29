import { Skeleton, type SkeletonProps } from '@patternfly/react-core';

import {
  getLwSkeletonDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './skeleton.css';

/** Owned slots + PF `Skeleton` passthrough — `className` / rest merge onto the Skeleton root. */
export type LwSkeletonProps = {
  // Lightwell-specific props land here as they are decided.
} & SkeletonProps;

/**
 * Kit **primitive** — configured PF `Skeleton` **root only**.
 * Defaults live in `components.config.ts` → `componentsConfig.skeleton`.
 */
export function LwSkeleton({ className, ...rest }: LwSkeletonProps) {
  const skeletonProps = mergeComponentProps(getLwSkeletonDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-skeleton', className),
  });
  return <Skeleton {...skeletonProps} />;
}

export default LwSkeleton;
