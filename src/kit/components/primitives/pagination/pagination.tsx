import { Pagination, type PaginationProps } from '@patternfly/react-core';

import {
  getLwPaginationDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './pagination.css';

/** Owned slots + PF `Pagination` passthrough — `className` / `style` / rest merge onto the Pagination root. */
export type LwPaginationProps = PaginationProps;

/**
 * Kit **primitive** — configured PF `Pagination`.
 * Logic harness, not a DOM wrap: root = `Pagination`; call-site props win via mergeComponentProps.
 * Defaults live in `components.config.ts` → `componentsConfig.pagination`.
 */
export function LwPagination({ className, ...rest }: LwPaginationProps) {
  const paginationProps = mergeComponentProps(getLwPaginationDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-pagination', className),
  });
  return <Pagination {...paginationProps} />;
}

export default LwPagination;
