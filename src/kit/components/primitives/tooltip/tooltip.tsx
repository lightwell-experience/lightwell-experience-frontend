import { Tooltip, type TooltipProps } from '@patternfly/react-core';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';
import type { ReactElement, ReactNode } from 'react';

import {
  getLwTooltipDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import { LwButton, type LwButtonProps } from '../button/button';
import './tooltip.css';

type LwTooltipOwnedProps = {
  /**
   * Trigger element — maps to PF Tooltip `children`.
   * When omitted, kit composes `LwButton` with `isCircle` + `variant="plain"`.
   */
  children?: ReactElement;
  /** Tooltip body — PF `content`. */
  content: ReactNode;
  /**
   * Applied to the default circle `LwButton` when `children` is omitted.
   * `isCircle` / `variant` stay kit-owned on that default (circle + plain).
   */
  triggerProps?: Omit<LwButtonProps, 'isCircle' | 'variant'>;
};

/** Owned slots + PF `Tooltip` passthrough. `children` / `content` owned above. */
export type LwTooltipProps = LwTooltipOwnedProps & Omit<TooltipProps, 'children' | 'content'>;

/**
 * Kit **primitive** — configured PF `Tooltip`.
 * Logic harness: root = `Tooltip`. Default trigger = circle plain `LwButton` + HelpIcon.
 * Call sites vary `content` / labels / icon; they do not reinvent the circle-help control.
 * Defaults live in `components.config.ts` → `componentsConfig.tooltip`.
 */
export function LwTooltip({ children, content, triggerProps, className, ...rest }: LwTooltipProps) {
  const tooltipProps = mergeComponentProps(getLwTooltipDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-tooltip', className),
  });

  const { children: triggerChildren, ...buttonTriggerProps } = triggerProps ?? {};
  const trigger = children ?? (
    <LwButton isCircle variant='plain' aria-label='More information' {...buttonTriggerProps}>
      {triggerChildren ?? <HelpIcon />}
    </LwButton>
  );

  return (
    <Tooltip {...tooltipProps} content={content}>
      {trigger}
    </Tooltip>
  );
}

export default LwTooltip;
