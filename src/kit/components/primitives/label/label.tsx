import { Label, type LabelProps } from '@patternfly/react-core';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';

import {
  getLwLabelDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import { LwPopover, type LwPopoverProps } from '../popover/popover';
import './label.css';

/** Lightwell statuses a label can present. Pages pass the status; the kit owns its look. */
export type LwLabelStatus = 'techPreview' | 'validated' | 'remediated' | 'predisclosure';

/** Semantic map — status → PF Label presentation. Change a status's look here, once. */
const LW_LABEL_STATUS_PROPS: Record<
  LwLabelStatus,
  Pick<LabelProps, 'color' | 'variant' | 'icon'>
> = {
  techPreview: { color: 'purple', icon: <InfoCircleIcon /> },
  validated: { color: 'purple', variant: 'outline' },
  remediated: { color: 'orange', variant: 'outline' },
  predisclosure: { color: 'orange' },
};

type LwLabelOwnedProps = {
  /** Lightwell status — maps to PF `color` / `variant` / `icon`. Call-site PF props still win. */
  status?: LwLabelStatus;
  /**
   * Popover content (header / body / footer, plus PF Popover options). When set, the label
   * becomes a keyboard-focusable button that toggles an `LwPopover`.
   */
  popover?: Omit<LwPopoverProps, 'hasTrigger'>;
};

/**
 * Lightwell-owned props + PF `Label` passthrough. PF's own `status` (success / warning / …) is
 * replaced by the Lightwell status map; add PF-style statuses to `LW_LABEL_STATUS_PROPS` if needed.
 */
export type LwLabelProps = LwLabelOwnedProps & Omit<LabelProps, 'status'>;

// PF renders an interactive (button) label only when it has a click handler; LwPopover owns
// open/close, so the handler itself has nothing to do.
const noop = () => undefined;

/**
 * Kit **primitive** — configured PF [`Label`](https://www.patternfly.org/components/label).
 * Logic harness: root = `Label`; `lw-c-label` merges onto that node (no wrapper).
 * `status` maps a Lightwell status to its presentation; `popover` makes the label a popover trigger.
 * Other PF props (`isCompact`, …) pass through and win over the status map.
 * Defaults live in `components.config.ts` → `componentsConfig.label`.
 */
export function LwLabel({ status, popover, className, ...rest }: LwLabelProps) {
  const labelProps = mergeComponentProps(
    { ...getLwLabelDefaults(), ...(status ? LW_LABEL_STATUS_PROPS[status] : {}) },
    {
      ...rest,
      className: mergeClassNames('lw-c-label', className),
    },
  );

  if (!popover) {
    return <Label {...labelProps} />;
  }

  return (
    <LwPopover
      {...popover}
      hasTrigger={<Label {...labelProps} onClick={labelProps.onClick ?? noop} />}
    />
  );
}

export default LwLabel;
