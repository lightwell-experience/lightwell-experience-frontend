export { LwPageHeader } from './page/page-header/page-header';
export type { LwPageHeaderProps } from './page/page-header/page-header';

export {
  PageChromeSlot,
  PageChromeSlotFooter,
  PageChromeSlots,
  PageTitleStack,
} from './page/page-chrome-slots';
export type {
  PageChromeSlotFooterProps,
  PageChromeSlotProps,
  PageChromeSlotsProps,
  PageTitleStackProps,
} from './page/page-chrome-slots';

export { LwButtonGroup } from './button-group/button-group';
export type { LwButtonGroupProps } from './button-group/button-group';

export { LwLoaded } from './loaded/loaded';
export type { LwLoadedProps } from './loaded/loaded';

export { LwMetricsStepper } from './metrics/stepper/metrics-stepper';
export type { LwMetricsStepperProps, LwMetricsStep } from './metrics/stepper/metrics-stepper';

export { LwMetricsCount } from './metrics/count/metrics-count';
export type { LwMetricsCountProps } from './metrics/count/metrics-count';

export { LwMetricsCountSlots } from './metrics/metrics-count-slots';
export type { LwMetricsCountSlotsProps } from './metrics/metrics-count-slots';

export { LwMetricsCard } from './metrics/card/metrics-card';
export type { LwMetricsCardProps } from './metrics/card/metrics-card';

// Victory-backed charts are intentionally NOT re-exported as values here.
// Re-exporting them pulls @patternfly/react-charts/victory (~950 KB) into every
// consumer of this barrel — including non-chart pages (Repositories landing, app
// root) — because the chart units carry side-effect CSS imports webpack cannot
// prune. Import the chart values directly from their unit paths on chart routes:
//   import { LwMetricsDonutChart } from 'kit/components/assemblies/metrics/donut/metrics-donut-chart';
//   import { LwMetricsStackChart } from 'kit/components/assemblies/metrics/stack/metrics-stack-chart';
// Type-only re-exports stay here (erased at compile, zero runtime cost).
export type {
  LwMetricsDonutChartProps,
  LwMetricsDonutDatum,
  LwMetricsDonutLegendPosition,
} from './metrics/donut/metrics-donut-chart';
export type {
  LwMetricsStackChartProps,
  LwMetricsStackSeries,
  LwMetricsStackBarDatum,
  LwMetricsStackA11yTable,
  LwMetricsStackLegendItem,
} from './metrics/stack/metrics-stack-chart';

export { LwStatItem } from './metrics/stat-item/stat-item';
export type { LwStatItemProps, LwStatItemVariant } from './metrics/stat-item/stat-item';

export { LwDataView, LwDataViewToolbar } from './data-view';
export type {
  LwDataViewProps,
  LwDataViewTh,
  LwDataViewTd,
  LwDataViewTr,
  LwDataViewEmptyStateConfig,
  LwDataViewManageColumn,
  ColumnManagementModalColumn,
  LwDataViewToolbarProps,
  LwDataViewSearchProps,
  LwDataViewPaginationProps,
  LwDataViewPanelToggleProps,
} from './data-view';

/**
 * Compat re-exports — Card / Popover live in primitives (A/B/C).
 * Existing page imports from `assemblies` keep working without touching domain files.
 */
export { LwCard } from '../primitives/card/card';
export type { LwCardProps } from '../primitives/card/card';

export { LwPopover } from '../primitives/popover/popover';
export type { LwPopoverProps } from '../primitives/popover/popover';
