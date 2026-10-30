/**
 * Lightwell tenant root config — top of the config cascade.
 *
 * Cascade:
 *   lightwell.config.ts  ← here (tenant identity + shared chromatic)
 *     └── components/components.config.ts  (primitive + assembly defaults)
 *           └── Lw* roots  (mergeComponentProps; call-site wins)
 *
 * Presentational paint for these keys lives in `lightwell.config.css`.
 * TS exposes the same keys as `var(...)` refs.
 */
export const lightwellConfig = {
  /** CSS class prefix for all Lightwell kit units. */
  cssPrefix: 'lightwell',
  /** Export / component name prefix for all Lw* kit units. */
  exportPrefix: 'lw',
  /**
   * Class on `<html>` for Lightwell routes.
   * Kit co-located CSS is webpack-scoped to `html.${htmlThemeClass}` (fec KitCssScopePlugin).
   * `LightwellApp` ensures this class while mounted; Chrome may also set it for /lightwell*.
   */
  htmlThemeClass: 'lightwell-v1-theme',
  /**
   * Chrome Lightwell page shell marker (`Page` className in insights-chrome).
   * Stage chrome may also pass PF `isPlain` → `pf-m-plain`; local/dev images often do not yet.
   */
  chromePageClass: 'chr-c-page--lightwell',
  /** PF Page plain modifier — required for Lightwell chrome overrides + PF plain tokens. */
  pagePlainClass: 'pf-m-plain',
  /**
   * Shared chromatic scales. Paint in `lightwell.config.css`.
   *
   * - `matchStatus` — Lens donut / MatchSummaryStats (exact / partial / none)
   * - `stepIcon` — metrics stepper icon fills (includes matchStatus keys + stubs).
   *   Call sites (e.g. Beacon) map domain → a key; the stepper stays generic.
   * - `matchStatusFallback` — unknown-ecosystem bar segments
   */
  colors: {
    matchStatus: {
      exact: 'var(--lw-color--match-status--exact)',
      partial: 'var(--lw-color--match-status--partial)',
      none: 'var(--lw-color--match-status--none)',
    },
    /**
     * Step icon background palette for `LwMetricsStepper` `steps[].color`.
     * Match-status keys share Lens tokens; blue/orange/red/purple/teal are stubs for
     * distinct per-step fills (Beacon pipeline / severity overrides).
     */
    stepIcon: {
      exact: 'var(--lw-color--match-status--exact)',
      partial: 'var(--lw-color--match-status--partial)',
      none: 'var(--lw-color--match-status--none)',
      blue: 'var(--lw-color--step-icon--blue)',
      orange: 'var(--lw-color--step-icon--orange)',
      red: 'var(--lw-color--step-icon--red)',
      purple: 'var(--lw-color--step-icon--purple)',
      teal: 'var(--lw-color--step-icon--teal)',
    },
    /** Purple fallbacks when an ecosystem has no brand token (Lens bar chart). */
    matchStatusFallback: {
      exact: 'var(--lw-color--match-status-fallback--exact)',
      partial: 'var(--lw-color--match-status-fallback--partial)',
    },
  },
  /**
   * Vulnerability severity scale, ordered most to least severe (matches the
   * backend's `CveCount` bucket keys). Beacon derives its `Severity` type and
   * filter-panel order from this constant. Lens's own `CveSeverity` type is
   * defined independently from the backend `CveCount` shape (see
   * `Lens/utils/cveSeverity.tsx`) — not derived from this scale — since its
   * value set and ordering are a separate, chart-specific concern.
   */
  vulnerabilitySeverity: {
    /** Ordered most to least severe. Matches backend CveCount bucket keys. */
    scale: ['Critical', 'Important', 'Moderate', 'Minor'] as const,
  },
} as const;

export type LwMatchStatusColorKey = keyof typeof lightwellConfig.colors.matchStatus;
/** Keys accepted by `LwMetricsStepper` `steps[].color`. */
export type LwStepIconColorKey = keyof typeof lightwellConfig.colors.stepIcon;

/**
 * Vulnerability severity — `'Critical' | 'Important' | 'Moderate' | 'Minor'`.
 * Derived from `lightwellConfig.vulnerabilitySeverity.scale`; import from here
 * rather than declaring a local type per page.
 */
export type LwVulnerabilitySeverity = (typeof lightwellConfig.vulnerabilitySeverity.scale)[number];
