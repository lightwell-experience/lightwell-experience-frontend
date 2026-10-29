import { useEffect, useState } from 'react';

import {
  lwBreakpoints,
  LW_BREAKPOINT_ORDER,
  type LwBreakpointKey,
} from '../components/components.config';

/** Current viewport breakpoint — 'xs' when below all defined breakpoints. */
export type LwActiveBreakpoint = LwBreakpointKey | 'xs';

/**
 * Resolve the current viewport breakpoint from `lwBreakpoints`.
 * Falls back to `'lg'` when `matchMedia` is unavailable (JSDOM / SSR).
 */
function resolveBreakpoint(): LwActiveBreakpoint {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'lg';
  }
  for (let i = LW_BREAKPOINT_ORDER.length - 1; i >= 0; i--) {
    const key = LW_BREAKPOINT_ORDER[i];
    if (window.matchMedia(`(min-width: ${lwBreakpoints[key]})`).matches) {
      return key;
    }
  }
  return 'xs';
}

/**
 * General-purpose viewport breakpoint hook.
 *
 * Returns the largest matching PF breakpoint key (`'xs'` when below `sm`).
 * Breakpoint values come from `components.config.ts`'s `lwBreakpoints` —
 * the centralized config for all kit responsive behavior.
 *
 * JSDOM / SSR fallback: `'lg'` (tests run as if on a desktop viewport).
 */
export function useLwBreakpoint(): LwActiveBreakpoint {
  const [bp, setBp] = useState<LwActiveBreakpoint>(resolveBreakpoint);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const queries = LW_BREAKPOINT_ORDER.map((key) => ({
      key,
      mql: window.matchMedia(`(min-width: ${lwBreakpoints[key]})`),
    }));

    const update = () => setBp(resolveBreakpoint());

    queries.forEach((q) => q.mql.addEventListener('change', update));
    update(); // catch any viewport change between the initial render and listener attachment
    return () => queries.forEach((q) => q.mql.removeEventListener('change', update));
  }, []);

  return bp;
}
