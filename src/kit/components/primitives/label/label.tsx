import { Label, type LabelProps } from '@patternfly/react-core';

import {
  getLwLabelDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './label.css';

/** PF `Label` passthrough — no Lightwell-owned props yet. */
export type LwLabelProps = LabelProps;

/**
 * Kit **primitive** — configured PF [`Label`](https://www.patternfly.org/components/label).
 * Logic harness: root = `Label`; `lw-c-label` merges onto that node (no wrapper).
 * Variants (`color`, `variant`, `icon`, `isCompact`, …) are pure PF passthrough at the call site.
 * Defaults live in `components.config.ts` → `componentsConfig.label`.
 */
export function LwLabel({ className, ...rest }: LwLabelProps) {
  const labelProps = mergeComponentProps(getLwLabelDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-label', className),
  });

  return <Label {...labelProps} />;
}

export default LwLabel;
