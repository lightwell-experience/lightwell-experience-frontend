import type { ReactNode } from 'react';
import {
  ToolbarItem,
  ToolbarItemVariant,
  type OnPerPageSelect,
  type OnSetPage,
  type ToolbarItemProps,
} from '@patternfly/react-core';
import RhUiOpenDrawerLeftIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-open-drawer-left-icon';
import ColumnsIcon from '@patternfly/react-icons/dist/esm/icons/columns-icon';
import {
  DataViewToolbar,
  type DataViewToolbarProps,
} from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';

import { getLwDataViewToolbarDefaults, mergeComponentProps } from '../../../components.config';
import { LwButton } from '../../../primitives/button/button';
import { LwSearchInput } from '../../../primitives/search-input/search-input';
import { LwPagination } from '../../../primitives/pagination/pagination';
import { useDataViewInternalContext } from '../data-view-context';

/** Search props — toolbar owns SearchInput rendering. Consumer passes data. */
export type LwDataViewSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  ariaLabel?: string;
};

/** Pagination props — toolbar owns Pagination rendering. Consumer passes data.
 *
 * `page` / `perPage` / `onSetPage` / `onPerPageSelect` are optional: when used
 * via `LwDataView`'s `pagination` prop and omitted, `LwDataView` resolves all
 * four itself (uncontrolled, internal page/perPage state — a page should never
 * need to hand-roll `useState(1)` just to turn pagination on). Provide them
 * for controlled mode (e.g. server-paginated data that needs to know when the
 * page changes to refetch), or when using `LwDataViewToolbar` directly without
 * `LwDataView`.
 *
 * `onSetPage` and `onPerPageSelect` use PF's native `OnSetPage`/`OnPerPageSelect`
 * types so hooks that return those types (e.g. `usePaginationLocalStorage`) can
 * be spread directly. Handlers with wider event params (`event: unknown`) are
 * also assignable by TypeScript contravariance. */
export type LwDataViewPaginationProps = {
  itemCount: number;
  page?: number;
  perPage?: number;
  onSetPage?: OnSetPage;
  onPerPageSelect?: OnPerPageSelect;
  variant?: 'top' | 'bottom';
  isCompact?: boolean;
  isDisabled?: boolean;
  widgetId?: string;
  id?: string;
};

/**
 * Panel toggle props — opt-in drawer toggle button.
 *
 * `isExpanded` / `onToggle` are optional: when used via `LwDataView`'s `panelToggle`
 * prop and omitted, `LwDataView` resolves both itself (uncontrolled, breakpoint-owned
 * default — see data-view ROADMAP D15) before this unit ever renders. Provide both
 * only for controlled mode, or when using `LwDataViewToolbar` directly without
 * `LwDataView`.
 */
export type LwDataViewPanelToggleProps = {
  isExpanded?: boolean;
  onToggle?: () => void;
  label?: string;
};

type LwDataViewToolbarOwnedProps = {
  /**
   * Search input — toolbar renders `LwSearchInput` from these data props.
   * First position in canonical order. Pass `false` to suppress.
   */
  search?: LwDataViewSearchProps | false;
  /**
   * Filter controls (e.g. `DataViewFilters` with checkbox/tree filters).
   * Rendered after search in the canonical order.
   */
  filters?: ReactNode;
  /**
   * Drawer panel toggle button — opt-in. Rendered after filters.
   * When provided, renders an `LwButton` with filter icon that toggles the panel.
   */
  panelToggle?: LwDataViewPanelToggleProps;
  /**
   * Opt-in "Manage columns" trigger button. Reads `onOpenManageColumns` from
   * the parent `LwDataView`'s context. Only renders when the parent `LwDataView`
   * has `manageColumns` set. Rendered in the actions position.
   */
  manageColumns?: boolean;
  /**
   * Non-filter actions (e.g. bulk select).
   * Rendered after the manageColumns button in the canonical order.
   */
  actions?: ReactNode;
  /**
   * Pagination — toolbar renders `LwPagination` from these data props.
   * End-aligned. Rendered as a `ToolbarItem` with `align: 'alignEnd'`
   * instead of `DataViewToolbar`'s own `pagination` prop, which misaligns with
   * top pagination — see `../ROADMAP.md` (commit 9bdb20c). Revert to the
   * `pagination` prop once PatternFly fixes that upstream.
   * Pass `false` to suppress.
   */
  pagination?: LwDataViewPaginationProps | false;
  /** Extra props for the pagination `ToolbarItem` (e.g. `visibility` to hide
   * top pagination on small screens). `variant` and `align` are owned by this
   * unit and can't be overridden here. */
  paginationItemProps?: Omit<ToolbarItemProps, 'variant' | 'align'>;
};

/** Owned slots + PF `DataViewToolbar` passthrough, minus its own `pagination`,
 * `filters`, and `actions` props (all superseded by owned slots above). */
export type LwDataViewToolbarProps = LwDataViewToolbarOwnedProps &
  Omit<DataViewToolbarProps, 'pagination' | 'filters' | 'actions'>;

/**
 * Kit **assembly unit** — `data-view/data-view-toolbar`.
 *
 * Owns `LwSearchInput` and `LwPagination` rendering — consumers pass data props,
 * not PF components. Uses `LwButton` for the panel toggle. Enforces canonical
 * slot order:
 *   search → filters → panelToggle → actions → children → pagination
 *
 * All slots are rendered as `children` of `DataViewToolbar` (not via its
 * `filters` / `actions` props) so the assembly controls DOM order.
 *
 * Bakes in the PF top-pagination alignment workaround so every caller gets
 * it for free. See `../ROADMAP.md` for family context.
 */
export function LwDataViewToolbar({
  search,
  filters,
  panelToggle,
  manageColumns,
  actions,
  pagination,
  paginationItemProps,
  children,
  ...rest
}: LwDataViewToolbarProps) {
  const toolbarProps = mergeComponentProps(getLwDataViewToolbarDefaults(), rest);
  const { onOpenManageColumns } = useDataViewInternalContext();

  const searchNode = search ? (
    <ToolbarItem>
      <LwSearchInput
        aria-label={search.ariaLabel ?? search.placeholder ?? 'Search'}
        placeholder={search.placeholder}
        value={search.value}
        onChange={(_e, val) => search.onChange(val)}
        onClear={() => {
          if (search.onClear) {
            search.onClear();
          } else {
            search.onChange('');
          }
        }}
      />
    </ToolbarItem>
  ) : null;

  const filtersNode = filters ? <ToolbarItem>{filters}</ToolbarItem> : null;

  const panelToggleNode = panelToggle ? (
    <ToolbarItem>
      <LwButton
        variant='plain'
        aria-label={panelToggle.label ?? 'Toggle filters'}
        aria-expanded={panelToggle.isExpanded}
        onClick={panelToggle.onToggle}
        icon={<RhUiOpenDrawerLeftIcon />}
      />
    </ToolbarItem>
  ) : null;

  const manageColumnsNode =
    manageColumns && onOpenManageColumns ? (
      <ToolbarItem>
        <LwButton variant='link' icon={<ColumnsIcon />} onClick={onOpenManageColumns}>
          Manage columns
        </LwButton>
      </ToolbarItem>
    ) : null;

  const actionsNode = actions ? <ToolbarItem>{actions}</ToolbarItem> : null;

  const paginationNode = pagination ? (
    <ToolbarItem
      {...paginationItemProps}
      variant={ToolbarItemVariant.pagination}
      align={{ default: 'alignEnd' }}
    >
      <LwPagination
        itemCount={pagination.itemCount}
        // Fallbacks only matter for standalone use without LwDataView — its
        // built-in path always resolves concrete values before rendering this.
        page={pagination.page ?? 1}
        perPage={pagination.perPage ?? 10}
        onSetPage={pagination.onSetPage ?? (() => {})}
        onPerPageSelect={pagination.onPerPageSelect ?? (() => {})}
        variant={pagination.variant === 'bottom' ? 'bottom' : undefined}
        isCompact={pagination.isCompact}
        isDisabled={pagination.isDisabled}
        widgetId={pagination.widgetId}
        id={pagination.id}
      />
    </ToolbarItem>
  ) : null;

  return (
    <DataViewToolbar {...toolbarProps}>
      {searchNode}
      {filtersNode}
      {panelToggleNode}
      {manageColumnsNode}
      {actionsNode}
      {children}
      {paginationNode}
    </DataViewToolbar>
  );
}

export default LwDataViewToolbar;
