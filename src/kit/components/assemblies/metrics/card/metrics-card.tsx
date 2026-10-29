import { CardBody } from '@patternfly/react-core';
import type { ReactNode } from 'react';

import { mergeClassNames, mergeComponentProps } from 'kit/components/components.config';
import { LwCard, type LwCardProps } from 'kit/components/primitives/card/card';
import './metrics-card.css';

type LwMetricsCardOwnedProps = {
  /** Card title slot → `LwCard` `hasHeader`. */
  hasHeader?: LwCardProps['hasHeader'];
  /** Card actions slot → `LwCard` `hasAction`. */
  hasAction?: LwCardProps['hasAction'];
  /** Count nodes for the card body. Ignored when `children` is set. */
  items?: ReactNode[];
  /** Body passthrough. Wins over `items`. */
  children?: ReactNode;
};

/** Owned slots + `LwCard` / Card passthrough (minus children — kit may build body). */
export type LwMetricsCardProps = LwMetricsCardOwnedProps &
  Omit<LwCardProps, 'children' | 'hasHeader' | 'hasAction'>;

/**
 * Kit **assembly** — `LwCard` shell with counts always in `CardBody`.
 * Cascade: `children` → body; else `items` → body; else empty body.
 * Without `hasHeader` / `hasAction`, LwCard composition mode would skip `CardBody` —
 * this assembly wraps body content so counts never land as bare card children.
 */
export function LwMetricsCard({
  hasHeader,
  hasAction,
  items,
  children,
  className,
  ...rest
}: LwMetricsCardProps) {
  const cardProps = mergeComponentProps(
    {},
    {
      ...rest,
      className: mergeClassNames('lw-c-metrics-card', className),
    },
  );

  const content = children ?? (items != null && items.length > 0 ? items : undefined);
  const headerEnabled = Boolean(hasHeader || hasAction);

  // Slot mode: LwCard builds header + CardBody.
  if (headerEnabled) {
    return (
      <LwCard {...cardProps} hasHeader={hasHeader} hasAction={hasAction}>
        {content}
      </LwCard>
    );
  }

  // Body-only: force CardBody so metrics counts are never direct Card children.
  return (
    <LwCard {...cardProps}>
      <CardBody>{content}</CardBody>
    </LwCard>
  );
}

export default LwMetricsCard;
