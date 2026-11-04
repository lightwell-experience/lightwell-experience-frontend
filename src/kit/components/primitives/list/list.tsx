import { List, ListItem, type ListProps } from '@patternfly/react-core';
import type { ReactNode } from 'react';

import {
  getLwListDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './list.css';

/** One row when using slot-build `items` (not children passthrough). */
export type LwListItem = {
  id?: string;
  children: ReactNode;
  /** Optional PF `ListItem` icon. */
  icon?: ReactNode;
};

type LwListOwnedProps = {
  /**
   * Slot build: item descriptors → `ListItem`s.
   * Ignored when `children` is provided (passthrough wins).
   */
  items?: LwListItem[];
  /**
   * Passthrough: caller owns list interior (`ListItem`s, …).
   * Wins over `items`.
   */
  children?: ReactNode;
};

/** Owned slots + PF `List` passthrough. */
export type LwListProps = LwListOwnedProps & Omit<ListProps, 'children'>;

/**
 * Kit **primitive** — configured PF [`List`](https://www.patternfly.org/components/list/).
 *
 * Cascade for interior:
 *   1. `children` → passthrough
 *   2. `items` → build `ListItem`s
 *   3. neither → empty list shell
 *
 * Defaults live in `components.config.ts` → `componentsConfig.list`.
 */
export function LwList({ items, children, className, ...rest }: LwListProps) {
  const listProps = mergeComponentProps(getLwListDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-list', className),
  });

  const content =
    children ??
    items?.map(({ id, children: itemChildren, icon }, index) => (
      <ListItem key={id ?? index} icon={icon}>
        {itemChildren}
      </ListItem>
    ));

  return <List {...listProps}>{content}</List>;
}

export default LwList;
