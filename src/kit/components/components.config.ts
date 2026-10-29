import type { CSSProperties, HTMLAttributes } from 'react';
import {
  ClipboardCopyVariant,
  type AlertProps,
  type ButtonProps,
  type CardProps,
  type ClipboardCopyProps,
  type DropdownProps,
  type EmptyStateProps,
  type FlexProps,
  type HeroProps,
  type IconComponentProps,
  type PopoverProps,
  type ProgressStepperProps,
  type SkeletonProps,
  type TitleProps,
  type ToolbarItemProps,
  type TooltipProps,
} from '@patternfly/react-core';
import type { DataViewTableBasicProps } from '@patternfly/react-data-view/dist/dynamic/DataViewTableBasic';
import type { DataViewToolbarProps } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';

import { lightwellConfig, type LwStepIconColorKey } from '../lightwell.config';

/**
 * Lightwell components domain config.
 *
 * Cascade:
 *   Prop / behavior:  lightwell.config.ts → this file → Lw* roots
 *   Presentational:   lightwell.config.css → components.config.css → page.config.css → unit *.css
 *                     (imported from LightwellApp — units consume var(--lw-*), do not re-declare)
 *
 * Covers both tiers within components/:
 *   - primitives/ (LwButton, LwCard, LwMenu, LwPopover, LwTooltip, LwEmptyState, LwSkeleton, …)
 *   - assemblies/ (LwPageHeader, LwButtonGroup, LwDataView, …)
 *
 * Tenant identity (cssPrefix, exportPrefix, brand tokens) comes from lightwell.config.ts.
 * Add component/assembly-specific **prop** defaults here.
 * Padding, font-size, font-weight, spacers → CSS track (not this file; not YAML).
 * PF utility classes → last resort; prefer co-located CSS + tokens.
 */

// Re-export tenant identity so consumers can reference it from one place.
export { lightwellConfig };

// ─── Shared viewport breakpoints ─────────────────────────────────────────────

/**
 * PF v6 viewport breakpoints — shared by kit components and hooks.
 * Values match the PatternFly SCSS vars (`$pf-v6-global--breakpoint--*`)
 * and the rem comment map in `components.config.css`.
 *
 * Use in `matchMedia` hooks (TS track). CSS `@media` queries copy the rem
 * directly — they cannot use CSS custom properties.
 */
export const lwBreakpoints = {
  sm: '36rem',
  md: '48rem',
  lg: '62rem',
  xl: '75rem',
  '2xl': '90.625rem',
} as const;

export type LwBreakpointKey = keyof typeof lwBreakpoints;

/** Ordered breakpoint names — smallest to largest. For ordinal comparison. */
export const LW_BREAKPOINT_ORDER: readonly LwBreakpointKey[] = ['sm', 'md', 'lg', 'xl', '2xl'];

/** True when `current` is at or above `target` in the breakpoint scale.
 * 'xs' (below sm) is below everything. */
export function isBreakpointAtLeast(
  current: LwBreakpointKey | 'xs',
  target: LwBreakpointKey,
): boolean {
  if (current === 'xs') return false;
  return LW_BREAKPOINT_ORDER.indexOf(current) >= LW_BREAKPOINT_ORDER.indexOf(target);
}

// ─── Shared merge constraint ─────────────────────────────────────────────────

/** Props that `mergeComponentProps` handles specially — className merges, style deep-merges. */
interface MergeableProps {
  className?: string;
  style?: CSSProperties;
}

// ─── Primitive: LwAlert ──────────────────────────────────────────────────────

/** Defaults for `LwAlert` — Alert host; call-site wins via merge. */
export type LwAlertConfig = Partial<AlertProps>;

// ─── Primitive: LwButton ─────────────────────────────────────────────────────

/** Defaults for `LwButton` — add variant / size here when Lightwell baseline is decided. */
export type LwButtonConfig = Partial<ButtonProps>;

// ─── Primitive: LwCard ───────────────────────────────────────────────────────

/** PF `Card` props forwarded by `LwCard` (excluding children and action — kit may own those). */
export type LwCardPassthroughProps = Omit<CardProps, 'children' | 'action'>;

/** Defaults for `LwCard`. Lightwell surfaces use glass by default. */
export type LwCardConfig = Partial<LwCardPassthroughProps>;

// ─── Primitive: LwMenu (PF Dropdown) ─────────────────────────────────────────

/** PF `Dropdown` props forwarded by `LwMenu` (excluding children / toggle — kit may own those). */
export type LwMenuPassthroughProps = Omit<DropdownProps, 'children' | 'toggle'>;

/** Defaults for `LwMenu` — Dropdown host; call-site wins via merge. */
export type LwMenuConfig = Partial<LwMenuPassthroughProps>;

// ─── Primitive: LwPopover ────────────────────────────────────────────────────

/** PF `Popover` props forwarded by `LwPopover` (excluding children / content slots — kit may own those). */
export type LwPopoverPassthroughProps = Omit<
  PopoverProps,
  'children' | 'headerContent' | 'bodyContent' | 'footerContent'
>;

/** Defaults for `LwPopover` — call-site wins via merge. */
export type LwPopoverConfig = Partial<LwPopoverPassthroughProps>;

// ─── Primitive: LwTooltip ────────────────────────────────────────────────────

/** PF `Tooltip` props forwarded by `LwTooltip` (excluding children / content — kit may own those). */
export type LwTooltipPassthroughProps = Omit<TooltipProps, 'children' | 'content'>;

/** Defaults for `LwTooltip` — call-site wins via merge. */
export type LwTooltipConfig = Partial<LwTooltipPassthroughProps>;

// ─── Primitive: LwEmptyState (root only) ─────────────────────────────────────

/** Defaults for `LwEmptyState` — EmptyState root; Footer/Actions/Body stay call-site children. */
export type LwEmptyStateConfig = Partial<EmptyStateProps>;

// ─── Primitive: LwSkeleton (root only) ───────────────────────────────────────

/** Defaults for `LwSkeleton` — Skeleton root; call-site wins via merge. */
export type LwSkeletonConfig = Partial<SkeletonProps>;

// ─── Primitive: LwTitle ──────────────────────────────────────────────────────

/** PF Title size tokens keyed by heading level — `h1` is the page-title baseline. */
export type LwTitleHeadingLevel = NonNullable<TitleProps['headingLevel']>;
export type LwTitleSize = NonNullable<TitleProps['size']>;

export type LwTitleSizesConfig = Partial<Record<LwTitleHeadingLevel, LwTitleSize>>;

/** Defaults for `LwTitle` — prop defaults + per-level size map.
 * Omit HTML `sizes` (string) so the kit map is not intersected with it. */
export type LwTitleConfig = Partial<Omit<TitleProps, 'children' | 'size' | 'sizes'>> & {
  sizes?: LwTitleSizesConfig;
};

// ─── Primitive: LwIcon ──────────────────────────────────────────────────────

/** Defaults for `LwIcon` — PF Icon host; call-site wins via merge. */
export type LwIconConfig = Partial<Omit<IconComponentProps, 'children'>>;

// ─── Primitive: LwClipboardCopy ──────────────────────────────────────────────

/** Defaults for `LwClipboardCopy` — ClipboardCopy host; call-site wins via merge. */
export type LwClipboardCopyConfig = Partial<Omit<ClipboardCopyProps, 'children' | 'ref'>>;

// ─── Assembly: LwPageHeader (plain or hero surface) ──────────────────────────

/** PF `Flex` props forwarded by plain `LwPageHeader` (excluding children). */
export type LwPageHeaderPassthroughProps = Omit<FlexProps, 'children' | 'title' | 'ref'>;

/** Defaults for plain `LwPageHeader` — Flex host; call-site wins via merge. */
export type LwPageHeaderConfig = Partial<LwPageHeaderPassthroughProps>;

/** PF `Hero` props forwarded when `LwPageHeader` `hero` is set. */
export type LwPageHeaderHeroPassthroughProps = Omit<HeroProps, 'children' | 'content' | 'title'>;

/** Defaults for hero surface — Hero host; call-site wins via merge. */
export type LwPageHeaderHeroConfig = Partial<LwPageHeaderHeroPassthroughProps>;

// ─── Assembly: LwButtonGroup (layout row) ────────────────────────────────────

/** Host attrs for `LwButtonGroup` (excluding children). */
export type LwButtonGroupPassthroughProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

/** Defaults for `LwButtonGroup` — layout host; call-site wins via merge. */
export type LwButtonGroupConfig = Partial<LwButtonGroupPassthroughProps>;

// ─── Assembly: LwMetricsStepper (PF ProgressStepper) ─────────────────────────

/** PF `ProgressStepper` props forwarded by `LwMetricsStepper` (kit builds children; compact is refused). */
export type LwMetricsStepperPassthroughProps = Omit<ProgressStepperProps, 'children' | 'isCompact'>;

/**
 * Defaults for `LwMetricsStepper` — ProgressStepper host; call-site wins via merge.
 * `isHorizontal` is kit-owned (PF CSS `pf-m-horizontal`; React has no matching prop).
 */
export type LwMetricsStepperConfig = Partial<LwMetricsStepperPassthroughProps> & {
  isHorizontal?: boolean;
};

// ─── Assembly: LwMetricsCount (PF text + bar) ─────────────────────────────────

/** Owned defaults for `LwMetricsCount` (layout direction + bar color). */
export type LwMetricsCountConfig = {
  direction?: 'column' | 'row';
  /** Default status-bar key when call site omits `color`. */
  color?: LwStepIconColorKey;
};

// ─── Assembly: LwMetricsCard (LwCard shell) ───────────────────────────────────

/** Owned defaults for `LwMetricsCard`. */
export type LwMetricsCardConfig = object;

// ─── Primitive: LwContent ─────────────────────────────────────────────────────

/** Defaults for `LwContent` — Content host; call-site wins via merge. */
export type LwContentConfig = Partial<
  Omit<import('@patternfly/react-core').ContentProps, 'children' | 'ref'>
>;

// ─── Primitive: LwSearchInput ────────────────────────────────────────────────

/** Defaults for `LwSearchInput` — SearchInput host; call-site wins via merge. */
export type LwSearchInputConfig = Partial<
  Omit<import('@patternfly/react-core').SearchInputProps, 'ref'>
>;

// ─── Primitive: LwPagination ─────────────────────────────────────────────────

/** Defaults for `LwPagination` — Pagination host; call-site wins via merge. */
export type LwPaginationConfig = Partial<
  Omit<import('@patternfly/react-core').PaginationProps, 'ref'>
>;

// ─── Primitive: LwDrawer ─────────────────────────────────────────────────────

/** Defaults for `LwDrawer` — Drawer host; call-site wins via merge. */
export type LwDrawerConfig = Partial<
  Omit<import('@patternfly/react-core').DrawerProps, 'children' | 'ref'>
>;

// ─── Primitive: LwCheckbox ────────────────────────────────────────────────────

/** Defaults for `LwCheckbox` — Checkbox host; call-site wins via merge. */
export type LwCheckboxConfig = Partial<
  Omit<import('@patternfly/react-core').CheckboxProps, 'id' | 'onChange' | 'ref'>
>;

// ─── Primitive: LwForm ───────────────────────────────────────────────────────

/** Defaults for `LwForm` — Form host; call-site wins via merge. */
export type LwFormConfig = Partial<
  Omit<import('@patternfly/react-core').FormProps, 'children' | 'ref'>
>;

// ─── Assembly: LwDataView (DataView + DataViewTable) ─────────────────────────

/** PF `DataViewTable` props forwarded by `LwDataView` (kit builds variant/columns/rows/bodyStates/headStates/isSticky; isTreeTable not supported). */
export type LwDataViewPassthroughProps = Omit<
  DataViewTableBasicProps,
  'variant' | 'columns' | 'rows' | 'bodyStates' | 'headStates' | 'isSticky' | 'isTreeTable'
>;

/**
 * Defaults for `LwDataView` — `DataViewTable` host; call-site wins via merge.
 * `isCompact` is kit-owned (maps to PF's `variant`, not a literal pass-through prop).
 */
export type LwDataViewConfig = Partial<LwDataViewPassthroughProps> & {
  isCompact?: boolean;
  /**
   * `false` (default) wraps `LwDataView` in a `Card` — `CardHeader` hosts the
   * built-in toolbar, `CardBody` hosts the full data-view surface. Set `true`
   * to opt out for pages that already provide their own container chrome.
   */
  isCardless?: boolean;
  /**
   * Starting `perPage` for uncontrolled pagination (when `pagination` is set
   * but `page`/`perPage`/`onSetPage`/`onPerPageSelect` are omitted — `LwDataView`
   * owns page state internally in that case). Has no effect on controlled
   * pagination, which always uses the call site's own `perPage`.
   */
  defaultPerPage?: number;
  /**
   * `ToolbarItem` props applied to the top pagination item in the built-in toolbar.
   * Default: hides on small screens and shows at `md`+, matching standard responsive
   * table patterns. Call-site-supplied `paginationItemProps` on a standalone
   * `LwDataViewToolbar` takes precedence.
   */
  builtInPaginationItemProps?: Omit<ToolbarItemProps, 'variant' | 'align'>;
};

// ─── Assembly: LwDataViewToolbar (DataViewToolbar) ───────────────────────────

/** PF `DataViewToolbar` props forwarded by `LwDataViewToolbar` (its own `pagination`,
 * `filters`, and `actions` props are superseded by the kit's owned slots). */
export type LwDataViewToolbarPassthroughProps = Omit<
  DataViewToolbarProps,
  'pagination' | 'filters' | 'actions'
>;

/** Defaults for `LwDataViewToolbar` — `DataViewToolbar` host; call-site wins via merge. */
export type LwDataViewToolbarConfig = Partial<LwDataViewToolbarPassthroughProps>;

// ─── Assembly: LwLoaded (loading / loaded surface) ───────────────────────────

/** Defaults for `LwLoaded` — default loading surface is PF `Skeleton` (text line). */
export type LwLoadedConfig = {
  /**
   * Optional PF Skeleton `fontSize` for the default loading surface.
   * Prefer text modifiers over a fixed `height` slab (PF card demos use lines).
   */
  fontSize?: SkeletonProps['fontSize'];
  /** Screen reader text for the default skeleton. */
  screenreaderText?: string;
};

// ─── Domain config shape ─────────────────────────────────────────────────────

/** Collected defaults for all Lw* units. Extend as primitives and assemblies land. */
export interface LwComponentsConfig {
  alert: LwAlertConfig;
  button: LwButtonConfig;
  card: LwCardConfig;
  menu: LwMenuConfig;
  popover: LwPopoverConfig;
  tooltip: LwTooltipConfig;
  emptyState: LwEmptyStateConfig;
  skeleton: LwSkeletonConfig;
  title: LwTitleConfig;
  icon: LwIconConfig;
  checkbox: LwCheckboxConfig;
  clipboardCopy: LwClipboardCopyConfig;
  content: LwContentConfig;
  drawer: LwDrawerConfig;
  form: LwFormConfig;
  pageHeader: LwPageHeaderConfig;
  pageHeaderHero: LwPageHeaderHeroConfig;
  buttonGroup: LwButtonGroupConfig;
  metricsStepper: LwMetricsStepperConfig;
  metricsCount: LwMetricsCountConfig;
  metricsCard: LwMetricsCardConfig;
  pagination: LwPaginationConfig;
  searchInput: LwSearchInputConfig;
  loaded: LwLoadedConfig;
  dataView: LwDataViewConfig;
  dataViewToolbar: LwDataViewToolbarConfig;
}

export const componentsConfig: LwComponentsConfig = {
  alert: {
    // Sensitive-data baseline used across remediated / predisclosure surfaces.
    variant: 'warning',
    isInline: true,
    title: 'This data is sensitive. Do not share or capture screenshots.',
  },
  button: {
    // No Lightwell-specific defaults yet — variant / size land here when decided.
  },
  card: {
    // Lightwell surfaces use glass cards by default.
    isGlass: true,
  },
  checkbox: {
    // No Lightwell-specific Checkbox defaults yet.
  },
  content: {
    // No Lightwell-specific Content defaults yet.
  },
  drawer: {
    isPill: true,
  },
  menu: {
    // No Lightwell-specific Dropdown defaults yet — position / plain land here when decided.
  },
  popover: {
    // No Lightwell-specific Popover defaults yet — position / animation land here when decided.
  },
  tooltip: {
    // Default trigger (circle plain LwButton) is composed in LwTooltip when children omitted.
  },
  emptyState: {
    // Root-only harness — no Lightwell-specific EmptyState defaults yet.
  },
  skeleton: {
    // Root-only harness — no Lightwell-specific Skeleton defaults yet.
  },
  title: {
    // Page titles default to h1; size for that level comes from `sizes.h1`.
    headingLevel: 'h1',
    sizes: {
      h1: '2xl',
    },
  },
  icon: {
    // No Lightwell-specific size yet — page title rows pass size from PageTitleStack.
  },
  form: {
    // No Lightwell-specific Form defaults yet.
  },
  clipboardCopy: {
    isReadOnly: true,
    hoverTip: 'Copy',
    clickTip: 'Copied',
    // PF applies `pf-m-inline` only for inlineCompact (button-group chrome styles that).
    variant: ClipboardCopyVariant.inlineCompact,
  },
  pageHeader: {
    justifyContent: { default: 'justifyContentSpaceBetween' },
    alignItems: { default: 'alignItemsFlexStart' },
  },
  pageHeaderHero: {
    // Lightwell chrome uses glass theme — keep Hero glass-capable by default.
    isGlass: true,
  },
  buttonGroup: {
    // Layout defaults live in button-group.css (gap / align).
  },
  metricsStepper: {
    // PF ProgressStepper is vertical below md; React has no isHorizontal — kit applies pf-m-horizontal.
    isHorizontal: true,
  },
  metricsCount: {
    direction: 'column',
    // Token-backed bar when call site omits `color` (e.g. Beacon Total → stepIcon.blue).
    color: 'blue',
  },
  metricsCard: {
    // Shell defaults live on LwCard / call-site composition.
  },
  pagination: {
    // No Lightwell-specific Pagination defaults yet.
  },
  searchInput: {
    // No Lightwell-specific SearchInput defaults yet.
  },
  loaded: {
    // PF text-line Skeleton (no fixed height slab). Call sites that know structure
    // pass `fallback` matching the loaded layout (see Beacon status summary).
    fontSize: 'md',
    screenreaderText: 'Loading',
  },
  dataView: {
    // Primary pages default to non-compact density; compact is an explicit
    // opt-in reserved for drawers/modals (flagged 2026-10-08).
    isCompact: false,
    // Card wrapper on by default (D19) — opt out via isCardless for pages
    // that already provide their own container chrome.
    isCardless: false,
    // Starting perPage for uncontrolled pagination (page state owned by
    // LwDataView when the call site doesn't supply page/onSetPage).
    defaultPerPage: 10,
    // Responsive grid breakpoint — collapse to stacked mobile layout at lg.
    gridBreakPoint: 'grid-lg' as const,
    // Striped rows for legibility on dense tables.
    isStriped: true,
    // Flat table surface — avoids double background on pages with PF plain chrome.
    isNoPlainOnGlass: true,
    // Built-in toolbar: hide top pagination on small screens; reveal at md+.
    builtInPaginationItemProps: { visibility: { default: 'hidden', md: 'visible' } },
  },
  dataViewToolbar: {
    // No Lightwell-specific DataViewToolbar defaults yet.
  },
};

export function getLwAlertDefaults(): LwAlertConfig {
  return { ...componentsConfig.alert };
}

export function getLwButtonDefaults(): LwButtonConfig {
  return { ...componentsConfig.button };
}

export function getLwCardDefaults(): LwCardConfig {
  return { ...componentsConfig.card };
}

export function getLwMenuDefaults(): LwMenuConfig {
  return { ...componentsConfig.menu };
}

export function getLwPopoverDefaults(): LwPopoverConfig {
  return { ...componentsConfig.popover };
}

export function getLwTooltipDefaults(): LwTooltipConfig {
  return { ...componentsConfig.tooltip };
}

export function getLwEmptyStateDefaults(): LwEmptyStateConfig {
  return { ...componentsConfig.emptyState };
}

export function getLwSkeletonDefaults(): LwSkeletonConfig {
  return { ...componentsConfig.skeleton };
}

export function getLwTitleDefaults(): Partial<TitleProps> {
  const { sizes, ...propDefaults } = componentsConfig.title;
  void sizes;
  return { ...propDefaults };
}

/** Resolve configured Title `size` for a heading level. Call-site `size` still wins upstream. */
export function getLwTitleSizeForLevel(headingLevel: LwTitleHeadingLevel): LwTitleSize | undefined {
  return componentsConfig.title.sizes?.[headingLevel];
}

export function getLwIconDefaults(): LwIconConfig {
  return { ...componentsConfig.icon };
}

export function getLwCheckboxDefaults(): LwCheckboxConfig {
  return { ...componentsConfig.checkbox };
}

export function getLwContentDefaults(): LwContentConfig {
  return { ...componentsConfig.content };
}

export function getLwFormDefaults(): LwFormConfig {
  return { ...componentsConfig.form };
}

export function getLwClipboardCopyDefaults(): LwClipboardCopyConfig {
  return { ...componentsConfig.clipboardCopy };
}

export function getLwDrawerDefaults(): LwDrawerConfig {
  return { ...componentsConfig.drawer };
}

export function getLwPageHeaderDefaults(): LwPageHeaderConfig {
  return { ...componentsConfig.pageHeader };
}

export function getLwPageHeaderHeroDefaults(): LwPageHeaderHeroConfig {
  return { ...componentsConfig.pageHeaderHero };
}

export function getLwButtonGroupDefaults(): LwButtonGroupConfig {
  return { ...componentsConfig.buttonGroup };
}

export function getLwMetricsStepperDefaults(): LwMetricsStepperConfig {
  return { ...componentsConfig.metricsStepper };
}

export function getLwMetricsCountDefaults(): LwMetricsCountConfig {
  return { ...componentsConfig.metricsCount };
}

export function getLwMetricsCardDefaults(): LwMetricsCardConfig {
  return { ...componentsConfig.metricsCard };
}

export function getLwPaginationDefaults(): LwPaginationConfig {
  return { ...componentsConfig.pagination };
}

export function getLwSearchInputDefaults(): LwSearchInputConfig {
  return { ...componentsConfig.searchInput };
}

export function getLwLoadedDefaults(): LwLoadedConfig {
  return { ...componentsConfig.loaded };
}

export function getLwDataViewDefaults(): LwDataViewConfig {
  return { ...componentsConfig.dataView };
}

export function getLwDataViewToolbarDefaults(): LwDataViewToolbarConfig {
  return { ...componentsConfig.dataViewToolbar };
}

// ─── Merge utilities ─────────────────────────────────────────────────────────

/**
 * Merge controller defaults with call-site props.
 *
 * Rules:
 * - Call-site wins on all props except className and style.
 * - className: both values concatenated (defaults first).
 * - style: shallow-merged (call-site wins per key).
 *
 * Note: the initial spread requires `as T` because TypeScript cannot prove that
 * `{ ...Partial<T>, ...T }` equals `T` for generic T. The constraint `T extends
 * MergeableProps` bounds the cast — className and style are always safe to mutate.
 */
export function mergeComponentProps<T extends MergeableProps>(
  defaults: Partial<T>,
  callSite: T,
): T {
  const merged = { ...defaults, ...callSite } as T;
  merged.className = mergeClassNames(defaults.className, callSite.className);
  if (defaults.style || callSite.style) {
    merged.style = { ...defaults.style, ...callSite.style };
  }
  return merged;
}

export function mergeClassNames(...classNames: Array<string | undefined>): string | undefined {
  const merged = classNames.filter(Boolean).join(' ');
  return merged || undefined;
}
