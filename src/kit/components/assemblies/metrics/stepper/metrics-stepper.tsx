import {
  ProgressStepper,
  ProgressStep,
  Tooltip,
  Truncate,
  type ProgressStepperProps,
  type ProgressStepProps,
} from '@patternfly/react-core';
import ResourcesFullIcon from '@patternfly/react-icons/dist/esm/icons/resources-full-icon';
import RhUiCheckCircleFillIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-check-circle-fill-icon';
import RhUiErrorFillIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-error-fill-icon';
import RhUiWarningFillIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-warning-fill-icon';
import type { ReactNode } from 'react';

import {
  getLwMetricsStepperDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import { lightwellConfig, type LwStepIconColorKey } from 'kit/lightwell.config';
import './metrics-stepper.css';

/** PF default step icons — mirrored so we can wrap them for icon-target tooltips. */
const PF_VARIANT_ICONS: Partial<Record<NonNullable<ProgressStepProps['variant']>, ReactNode>> = {
  success: <RhUiCheckCircleFillIcon />,
  info: <ResourcesFullIcon />,
  warning: <RhUiWarningFillIcon />,
  danger: <RhUiErrorFillIcon />,
};

/** One step descriptor for slot-build mode — maps onto PF `ProgressStep`. */
export type LwMetricsStep = {
  id: string;
  /** Step title (`ProgressStep` children). */
  label: ReactNode;
  /**
   * Tooltip on the **step icon** (not the title). Titles stay plain text.
   * Both unhydrated and hydrated.
   */
  tooltip?: ReactNode;
  /**
   * Metric value — rendered **above** `label` when hydrated (not PF `description`).
   * String/number values use PF `Truncate` (container / width ellipsis).
   */
  value?: ReactNode;
  /**
   * PF `ProgressStep` variant when hydrated (structure / default glyphs).
   * Unhydrated forces `pending`. Prefer `color` for Lightwell icon fills.
   */
  variant?: ProgressStepProps['variant'];
  /** PF `isCurrent` — in-progress step when hydrated. */
  isCurrent?: boolean;
  /**
   * Custom step icon (PF `icon` passthrough). Overrides the variant default icon.
   * Prefer PF/React-icons glyphs — see Progress stepper “With custom icons”.
   */
  icon?: ReactNode;
  /**
   * Icon **background** from `lightwellConfig.colors.stepIcon`.
   * Call site maps domain → key (Beacon assigns a distinct key per pipeline step).
   * Applied when hydrated via `--lw-metrics-step-icon-bg`.
   */
  color?: LwStepIconColorKey;
};

type LwMetricsStepperOwnedProps = {
  /** Ordered steps. Call site owns domain labels / values / tooltips / PF variants / icons. */
  steps: LwMetricsStep[];
  /**
   * Unhydrated → all `pending` (empty circles); titles hidden via kit CSS.
   * Hydrated → titles/values; call-site PF variants / `isCurrent` / icons.
   */
  isHydrated?: boolean;
  /**
   * Force horizontal band — applies PF CSS `pf-m-horizontal`.
   * PF React only exposes `isVertical`; default layout is vertical below md.
   * Kit gap fill — see `kit/docs/patternfly-gaps.md`. Default `true` via config.
   */
  isHorizontal?: boolean;
};

/** Owned slots + PF `ProgressStepper` passthrough. Kit owns `children`; PF `isCompact` is refused. */
export type LwMetricsStepperProps = LwMetricsStepperOwnedProps &
  Omit<ProgressStepperProps, 'children' | 'isCompact'>;

const resolveStepIcon = (
  step: LwMetricsStep,
  variant: ProgressStepProps['variant'],
): ReactNode | undefined => {
  if (step.icon != null) {
    return step.icon;
  }
  if (variant && PF_VARIANT_ICONS[variant] != null) {
    return PF_VARIANT_ICONS[variant];
  }
  // Pending / default: empty circle. Hit target so tooltip can sit on the icon, not the title.
  if (step.tooltip != null) {
    return <span className='lw-c-metrics-stepper__icon-hit' aria-hidden='true' />;
  }
  return undefined;
};

const wrapIconTooltip = (icon: ReactNode, tooltip: ReactNode, label: ReactNode): ReactNode => (
  <Tooltip content={tooltip} position='top'>
    <span
      className='lw-c-metrics-stepper__icon-trigger'
      tabIndex={0}
      role='img'
      aria-label={typeof label === 'string' ? `${label}: more information` : 'Step information'}
    >
      {icon}
    </span>
  </Tooltip>
);

/** Inline metric value — PF Truncate for string/number (large counts); else pass through.
 * Container Truncate (resize / ellipsis) — do not use `maxCharsDisplayed` (`pf-m-fixed`);
 * that disables width-based truncation. Title column CSS gives Truncate a measurable width.
 */
const renderInlineValue = (value: ReactNode): ReactNode => {
  if (typeof value === 'string' || typeof value === 'number') {
    return <Truncate content={String(value)} />;
  }
  return value;
};

const renderStepTitle = (step: LwMetricsStep): ReactNode => (
  <>
    <span className='lw-c-metrics-stepper__count'>
      {step.value != null ? renderInlineValue(step.value) : null}
    </span>
    <span className='lw-c-metrics-stepper__text'>{step.label}</span>
  </>
);

/**
 * Kit **assembly** — hydratable metrics stepper on PF `ProgressStepper`.
 * Logic harness: host = `ProgressStepper`. Plug-and-play — no product coupling.
 *
 * Structure from PatternFly (`variant`, `isCurrent`, `icon`, alignment). Compact is not used.
 * Icon **fill** from tenant config via `steps[].color` → `stepIcon` tokens.
 * Hydrated `value` stacks above the label (PF Truncate on string/number counts).
 * Count + text spans are always present — CSS hides the title pre-hydrate.
 * Tooltips target the step **icon**.
 */
export function LwMetricsStepper({
  steps,
  isHydrated = false,
  isHorizontal,
  className,
  'aria-label': ariaLabel,
  ...rest
}: LwMetricsStepperProps) {
  // Strip kit-owned isHorizontal from PF host defaults (not a ProgressStepper prop).
  const { isHorizontal: defaultHorizontal, ...pfDefaults } = getLwMetricsStepperDefaults();
  const horizontal = isHorizontal ?? defaultHorizontal ?? false;

  // PF host props passthrough via merge — call-site wins. Compact is not used.
  const stepperProps = mergeComponentProps(pfDefaults, {
    ...rest,
    // Horizontal wins over isVertical — do not ship both modifiers.
    isVertical: horizontal ? false : rest.isVertical,
    'aria-label': ariaLabel,
    className: mergeClassNames(
      'lw-c-metrics-stepper',
      isHydrated ? 'lw-m-hydrated' : 'lw-m-unhydrated',
      horizontal ? 'pf-m-horizontal' : undefined,
      className,
    ),
  });

  return (
    <ProgressStepper {...stepperProps}>
      {steps.map((step) => {
        const titleId = `${step.id}-title`;
        const variant: ProgressStepProps['variant'] = isHydrated
          ? (step.variant ?? 'default')
          : 'pending';
        const baseIcon = resolveStepIcon(step, variant);
        const icon =
          step.tooltip != null && baseIcon != null
            ? wrapIconTooltip(baseIcon, step.tooltip, step.label)
            : baseIcon;
        const ariaLabelForStep =
          typeof step.label === 'string'
            ? `${step.label}${
                isHydrated && step.value != null ? `, ${String(step.value)}` : ''
              }${step.tooltip != null && typeof step.tooltip === 'string' ? `. ${step.tooltip}` : ''}`
            : undefined;

        const colorToken =
          isHydrated && step.color != null
            ? lightwellConfig.colors.stepIcon[step.color]
            : undefined;

        return (
          <ProgressStep
            key={step.id}
            id={step.id}
            titleId={titleId}
            variant={variant}
            isCurrent={isHydrated ? Boolean(step.isCurrent) : false}
            icon={icon}
            aria-label={ariaLabelForStep}
            className={
              colorToken != null
                ? mergeClassNames(
                    'lw-m-color',
                    step.color === 'none' ? 'lw-m-color-muted-fg' : undefined,
                  )
                : undefined
            }
            style={
              colorToken != null
                ? ({ ['--lw-metrics-step-icon-bg']: colorToken } as React.CSSProperties)
                : undefined
            }
          >
            {renderStepTitle(step)}
          </ProgressStep>
        );
      })}
    </ProgressStepper>
  );
}

export default LwMetricsStepper;
