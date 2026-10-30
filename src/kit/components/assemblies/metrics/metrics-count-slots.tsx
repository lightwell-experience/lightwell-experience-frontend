import type { HTMLAttributes } from 'react';

import { mergeClassNames } from 'kit/components/components.config';
import './metrics-count-slots.css';

/** Owned slots + div host passthrough. */
export type LwMetricsCountSlotsProps = HTMLAttributes<HTMLDivElement>;

/**
 * Kit **assembly** — equal-column auto-grid for `LwMetricsCount` cells.
 * Parallel to `PageChromeSlots` at the page layer.
 *
 * Pass `LwMetricsCount` children directly; do not wrap them in PF `Flex`.
 * Grid columns are equal-width (`1fr`) so count cells are visually balanced
 * regardless of content length. Call sites that need loading skeletons pass
 * skeleton column nodes as children — the grid governs both states.
 */
export function LwMetricsCountSlots({ className, children, ...rest }: LwMetricsCountSlotsProps) {
  return (
    <div {...rest} className={mergeClassNames('lw-c-metrics-count-slots', className)}>
      {children}
    </div>
  );
}

export default LwMetricsCountSlots;
