import type { HTMLAttributes, ReactNode } from 'react';

import {
  getLwLoadedDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import { LwSkeleton } from 'kit/components/primitives/skeleton/skeleton';
import './loaded.css';

type LwLoadedOwnedProps = {
  /**
   * When `true`, render `children`. When `false` / omitted, render the loading
   * surface (`fallback` or pre-configured `LwSkeleton`).
   */
  isLoaded?: boolean;
  /** Override the default loading surface. */
  fallback?: ReactNode;
  /** Content shown when `isLoaded`. */
  children?: ReactNode;
};

/** Owned slots + host attrs (layout reservation / a11y on the loading host). */
export type LwLoadedProps = LwLoadedOwnedProps & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

/**
 * Kit **assembly** — loaded / loading surface pre-config.
 *
 * Keeps surrounding chrome (e.g. `LwMetricsCard` header) mounted while body
 * hydrates. Default loading surface = `LwSkeleton` from `componentsConfig.loaded`.
 * When loaded, children render without an extra host (Rule 0).
 */
export function LwLoaded({
  isLoaded = false,
  fallback,
  children,
  className,
  ...rest
}: LwLoadedProps) {
  const defaults = getLwLoadedDefaults();

  if (isLoaded) {
    return <>{children}</>;
  }

  const hostProps = mergeComponentProps(
    {},
    {
      ...rest,
      className: mergeClassNames('lw-c-loaded', 'lw-m-loading', className),
      'aria-busy': true as const,
    },
  );

  return (
    <div {...hostProps}>
      {fallback ?? (
        <LwSkeleton fontSize={defaults.fontSize} screenreaderText={defaults.screenreaderText} />
      )}
    </div>
  );
}

export default LwLoaded;
