import {
  Fragment,
  useId,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  DataView,
  DataViewState,
  type DataViewProps,
} from '@patternfly/react-data-view/dist/dynamic/DataView';
import {
  DataViewTable,
  isDataViewTrObject,
  isDataViewTdObject,
  type DataViewTh,
  type DataViewTr,
  type DataViewTd,
} from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import type { DataViewTableBasicProps } from '@patternfly/react-data-view/dist/dynamic/DataViewTableBasic';
import {
  CardBody,
  CardHeader,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  type DrawerPanelContentProps,
} from '@patternfly/react-core';
import {
  OuterScrollContainer,
  InnerScrollContainer,
  type ThProps,
  type TdProps,
  type TrProps,
} from '@patternfly/react-table';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import {
  SkeletonTableBody,
  type ColumnManagementModalColumn,
} from '@patternfly/react-component-groups';
import ColumnManagementModal from '@patternfly/react-component-groups/dist/dynamic/ColumnManagementModal';

import {
  getLwDataViewDefaults,
  isBreakpointAtLeast,
  mergeClassNames,
  mergeComponentProps,
} from '../../components.config';
import { useLwBreakpoint } from '../../../hooks/useLwBreakpoint';
import { LwButton } from '../../primitives/button/button';
import { LwCard } from '../../primitives/card/card';
import { LwDrawer, type LwDrawerResponsiveConfig } from '../../primitives/drawer/drawer';
import { LwEmptyState } from '../../primitives/empty-state/empty-state';
import {
  LwDataViewToolbar,
  type LwDataViewSearchProps,
  type LwDataViewPaginationProps,
  type LwDataViewPanelToggleProps,
} from './data-view-toolbar/data-view-toolbar';
import { DataViewInternalContext } from './data-view-context';
import './data-view.css';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * `LwDataView` column definition — extends PF `ThProps` with a
 * Lightwell-owned `isSortable` opt-in.
 *
 * Preserves full PF `Th` prop type-safety (`sort`, `isStickyColumn`, `modifier`,
 * `width`, etc.) while adding one Lightwell-owned field. Columns are **not**
 * sortable by default — a half-working sort (client-side only, against a
 * server-paginated dataset) silently produces wrong cross-page ordering. Set
 * `props.isSortable: true` on a column only once the call site can actually
 * guarantee correct ordering — a fully resident dataset, or an `onSortChange`
 * wired to re-fetch sorted data from the API.
 */
export type LwDataViewTh = {
  cell: ReactNode;
  /**
   * Optional stable identifier for this column. Only required when the
   * column also appears in `manageColumns.columns` — it's how `LwDataView`
   * correlates a catalog entry back to PF's column-management state.
   */
  key?: string;
  props?: ThProps & {
    /**
     * `true` opts this column in to automatic sort injection. Omit (or set
     * `false`) to leave the header unsortable — the default, since sort is
     * only correct when the call site owns full-dataset ordering (resident
     * data, or API-driven sort via `onSortChange`).
     * Stripped from props before PF sees the column definition.
     */
    isSortable?: boolean;
  };
};

/**
 * `LwDataView` cell definition — extends PF `TdProps` with a Lightwell-owned
 * `sortValue` for content-based sort (D16).
 *
 * `LwDataView` sorts rows by comparing each cell's `sortValue` directly —
 * no page-side comparator or business logic required. Omit `sortValue` and
 * a string/number `cell` is used as-is (dates, IDs, plain text sort
 * correctly for free). Provide `sortValue` when the rendered `cell` isn't
 * directly comparable (e.g. a `<Label>`) or when display order differs
 * from a plain string compare — e.g. a severity rank, not its label, so
 * "Critical" sorts above "Important" instead of alphabetically.
 */
export type LwDataViewTd =
  | ReactNode
  | {
      cell: ReactNode;
      props?: TdProps & {
        sortValue?: string | number;
      };
    };

/** `LwDataView` row definition — `LwDataViewTd[]` cells, same shape as PF's `DataViewTr`. */
export type LwDataViewTr =
  | LwDataViewTd[]
  | {
      row: LwDataViewTd[];
      id?: string;
      props?: TrProps;
    };

/**
 * Default empty-state configuration for `LwDataView`. When `activeState` is
 * `DataViewState.empty` and no `bodyStates[DataViewState.empty]` override is
 * provided, `LwDataView` renders `LwEmptyState` below the table headers (outside
 * the horizontal scroll container) using these values.
 *
 * For a fully custom empty-state body, use `bodyStates[DataViewState.empty]`
 * directly (that path renders in-table and overrides this config entirely).
 */
export type LwDataViewEmptyStateConfig = {
  /** Title text for the filtered-to-zero state. Defaults to `'No results found'`. */
  titleText?: string;
  /** Description text for the filtered-to-zero state. Omit for no body. */
  bodyText?: string;
  /**
   * Copy for the true-empty state (no rows and nothing to clear). Never falls
   * back to the filtered-to-zero `titleText` / `bodyText` (that copy tells the
   * user to reset filters); an omitted `titleText` is `'No results found'` and
   * an omitted `bodyText` renders no body.
   */
  noData?: {
    titleText?: string;
    bodyText?: string;
  };
} & (
  | {
      /**
       * Renders a "Reset filters" primary button in the filtered-to-zero state.
       * Never rendered in true empty (there is nothing to reset). Supplying it
       * requires stating `hasActiveFilters` explicitly, so true empty can never
       * be silently unreachable.
       */
      onClearFilters: () => void;
      /**
       * Whether any caller-owned filter is active (e.g. checkbox filters in the
       * `panel`) — a fact about the page's filter state, not an empty-state
       * decision. `LwDataView` combines it with a non-empty `search.value` and
       * `pagination.itemCount` to classify true empty vs filtered-to-zero itself.
       */
      hasActiveFilters: boolean;
    }
  | {
      onClearFilters?: undefined;
      /** See above. Defaults to `false` (no filters to clear). */
      hasActiveFilters?: boolean;
    }
);

// Re-exported for callers that need PF's column-management shape directly.
export type { ColumnManagementModalColumn };

/**
 * `LwDataView` column-management catalog entry — an `LwDataViewTh` plus the
 * visibility state `ColumnManagementModal` needs. Callers hydrate the full
 * column catalog as these; `LwDataView` derives PF's
 * `ColumnManagementModalColumn[]` (including `isUntoggleable` — the first
 * column and any sticky column can't be hidden without breaking the table)
 * internally, so no call site recomputes that shape itself.
 */
export type LwDataViewManageColumn = LwDataViewTh & {
  key: string;
  isShown: boolean;
  isShownByDefault: boolean;
};

// ─── Owned props ──────────────────────────────────────────────────────────────

type LwDataViewOwnedProps = {
  /**
   * When `true`, the assembly activates the loading state and shows the default
   * `SkeletonTableBody` automatically — no `activeState` required from the call site.
   * When loading ends and `rows` is empty, the assembly transitions to the empty
   * state automatically. Use `emptyState` to configure the empty state copy and
   * clear-filters action.
   *
   * Explicit `activeState` overrides this derivation entirely (backward compat for
   * callers using `useTableActiveState` hooks).
   */
  isLoading?: boolean;
  /**
   * `true` while `rows` are the previous query's result, shown until the next
   * one lands (e.g. react-query placeholder data). Unlike `isLoading` it keeps
   * the toolbar and `panel` mounted, but it is never classified as true empty:
   * a stale 0-row result must not flash the "no data" state (or unmount the
   * search box) while a refetch is in flight.
   */
  isPlaceholderData?: boolean;
  /**
   * Explicit loading/error/empty state override. Prefer `isLoading` for the common
   * case — the assembly derives `loading` and `empty` states automatically from
   * `isLoading` and `rows`. Use this only when finer control is needed (e.g., error
   * state, or callers using `useTableActiveState`-style hooks).
   */
  activeState?: DataViewState;
  /**
   * Column definitions. Accepts `LwDataViewTh` (Lightwell extension of PF `DataViewTh`).
   * Add `props.isSortable: true` to opt a specific column in to automatic sort
   * injection — sort is off by default (see `LwDataViewTh`).
   */
  columns: LwDataViewTh[];
  /** Row definitions. Accepts `LwDataViewTr` (Lightwell extension of PF `DataViewTr`).
   * Supports PF `Td` passthrough via `props`, including `isStickyColumn` /
   * `hasLeftBorder` / `hasRightBorder` for sticky columns, and `sortValue` for
   * content-based sort (D16) — see `LwDataViewTd`. */
  rows: LwDataViewTr[];
  /** Table body states to render per `activeState`. */
  bodyStates?: Partial<Record<DataViewState, ReactNode>>;
  headStates?: Partial<Record<DataViewState, ReactNode>>;
  /**
   * Default empty state, rendered when `activeState` is `DataViewState.empty`
   * (and no `bodyStates[DataViewState.empty]` override is given). Falls back to a
   * generic "No results found" when absent. Two layouts:
   *
   * - **Filtered-to-zero** (`emptyState.hasActiveFilters` is true, or
   *   `search.value` is non-empty, or
   *   `pagination.itemCount > 0`): rendered **below the table headers**,
   *   outside the horizontal scroll container, with the built-in toolbar and
   *   `panel` kept so the user can recover. Uses `titleText` / `bodyText` and
   *   the Reset button (when `onClearFilters` is supplied).
   * - **True empty** (none of the above): rendered **alone** — no table
   *   headers, built-in toolbar (including `toolbarSlot`) or `panel`, since
   *   there is nothing to filter. Uses `noData` copy and no Reset button. A
   *   caller that needs the toolbar or panel to stay visible while empty must
   *   set `hasActiveFilters`, or use `bodyStates[DataViewState.empty]`.
   *
   * The caller passes facts (`hasActiveFilters`, copy for each case); the
   * classification lives here so pages don't re-derive it.
   *
   * Use `bodyStates[DataViewState.empty]` for a fully custom in-table override.
   */
  emptyState?: LwDataViewEmptyStateConfig;
  /**
   * Optional callback invoked when the user sorts a column. The assembly manages
   * sort UI state (active column indicator) internally — `onSortChange` is only
   * needed when the call site must react to sort changes (e.g., to re-fetch with
   * API sort params). Column headers are not sortable by default; opt in
   * per-column via `LwDataViewTh.props.isSortable = true`.
   */
  onSortChange?: (columnIndex: number, direction: 'asc' | 'desc') => void;
  /**
   * Search input for the built-in toolbar. When provided (along with `pagination`
   * or `panelToggle`), `LwDataView` renders `LwDataViewToolbar` internally —
   * no explicit `<LwDataViewToolbar>` child required.
   * Toolbar is hidden during `activeState === DataViewState.loading`.
   */
  search?: LwDataViewSearchProps;
  /**
   * Pagination for the built-in top toolbar. Omit `page`/`perPage`/`onSetPage`/
   * `onPerPageSelect` for uncontrolled behavior — `LwDataView` owns page state
   * internally (default `perPage` from `components.config.ts`'s
   * `dataView.defaultPerPage`), top and bottom pagination stay in sync. Provide
   * them explicitly only when something needs to react to page changes (e.g.
   * server-paginated data that must refetch). The top pagination renders
   * compact by default; bottom pagination (see `showBottomPagination`) is
   * full-size.
   *
   * `itemCount` is required for server-paginated data (only the caller knows
   * the total); omit it under `isResident`, where the assembly derives it.
   */
  pagination?: Omit<LwDataViewPaginationProps, 'itemCount'> & { itemCount?: number };
  /**
   * Declares `rows` to be the **complete** result set, not one server page.
   * The assembly then owns paging: it sorts across every row and slices the
   * requested page out of the sorted set, and derives `pagination.itemCount`
   * from `rows.length`.
   *
   * Default `false` — rows are assumed to be a single server page, so they are
   * sorted and rendered as given. Slicing resident rows at the call site is the
   * bug this prop exists to prevent: the assembly would only ever see one page
   * and sort within it, so a sort would silently reorder the current page
   * instead of the whole set.
   */
  isResident?: boolean;
  /**
   * Panel toggle button for the built-in toolbar — opens/closes the `panel` drawer.
   * Pass `{}` for uncontrolled behavior: `LwDataView` owns expanded state, seeded
   * from the active breakpoint and reset on breakpoint crossings (D15) — a page
   * never needs to decide whether the panel starts open. Pass `isExpanded` /
   * `onToggle` explicitly only to take full control (controlled mode).
   */
  panelToggle?: LwDataViewPanelToggleProps;
  /**
   * Content injected into the built-in toolbar between the panel-toggle/manage-columns
   * buttons and the pagination control. Only meaningful when the toolbar is built-in
   * (`search`, `pagination`, or `panelToggle` is provided).
   */
  toolbarSlot?: ReactNode;
  /**
   * When `false`, suppresses the bottom footer pagination that `LwDataView` renders
   * by default whenever `pagination` is set, not loading, and `itemCount > 0`.
   * Mutually exclusive with providing a pagination `<LwDataViewToolbar>` in `footer`.
   */
  showBottomPagination?: boolean;
  /**
   * Opt-in to PF's compact table density. Defaults to non-compact (see
   * `components.config.ts`'s `dataView.isCompact`) — compact is reserved for
   * drawers/modals, not primary page views.
   */
  isCompact?: boolean;
  /**
   * Opt out of the default `Card` wrapper (see `components.config.ts`'s
   * `dataView.isCardless`, default `false`). `CardHeader` hosts the built-in
   * toolbar, `CardBody` hosts the full data-view surface (table + drawer +
   * bottom pagination). Set `true` for pages that already provide their own
   * container chrome.
   */
  isCardless?: boolean;
  /**
   * Sticky **columns** — horizontal scroll via `OuterScrollContainer`/
   * `InnerScrollContainer`, so columns with `props.isStickyColumn` pin while
   * scrolling. **Opt-in only** — not a default. Requires verified layout
   * context (columns actually marked `isStickyColumn`); do not enable
   * speculatively.
   *
   * Does **not** enable sticky *header* — that needs a height-bounded
   * scroll context to mean anything (the header sticks relative to its own
   * scrolling ancestor), and table height isn't bounded today. Held pending
   * that refactor (ROADMAP D26) rather than shipped half-working.
   */
  isSticky?: boolean;
  /** Arbitrary chrome above the table, inside `DataView`. */
  children?: ReactNode;
  /** Chrome after the table, inside `DataView` (e.g. custom footer chrome).
   * For bottom pagination, prefer `showBottomPagination` instead. */
  footer?: ReactNode;
  /** PF `DataView` selection context — wires bulk-select/checkbox state to the table. */
  selection?: DataViewProps['selection'];
  /** className for the outer `DataView` host. */
  wrapperClassName?: string;
  /** style for the outer `DataView` host. */
  wrapperStyle?: CSSProperties;
  /** OUIA id for the outer `DataView` host. */
  containerOuiaId?: string;
  /** Opt-in drawer panel body content. When provided, wraps the table in `LwDrawer`. */
  panel?: ReactNode;
  /** Optional drawer panel head content. Only meaningful when `panel` is provided. */
  panelHead?: ReactNode;
  /**
   * Drawer close handler — renders a close button in the panel head.
   * When `panelToggle` is provided, its `onToggle` is used automatically;
   * this prop is only needed when the panel is controlled without a toolbar
   * toggle button.
   */
  onPanelClose?: () => void;
  /**
   * Controlled expanded state for the drawer, for panels without a toolbar
   * toggle button. Omit for uncontrolled behavior (see `panelToggle`) —
   * this is the escape hatch for the rare case a page genuinely needs to
   * own panel-expanded state itself.
   */
  isPanelExpanded?: boolean;
  /** PF `DrawerPanelContent` passthrough. */
  panelProps?: Omit<DrawerPanelContentProps, 'children'>;
  /**
   * Responsive drawer behavior — viewport-driven mode switching.
   * Defaults to `{}` (responsive) when `panel` is provided.
   * Pass an explicit config to override breakpoints, or `false` to opt out
   * and use a static inline drawer.
   */
  responsive?: LwDrawerResponsiveConfig | false;
  /**
   * Opt-in column management. `LwDataView` renders `ColumnManagementModal` and
   * manages its open state. The built-in toolbar renders the "Manage columns"
   * trigger automatically when this is set. Pass the full column catalog
   * (shown and hidden) as `columns` — `LwDataView` derives PF's
   * `ColumnManagementModalColumn[]`, including which columns can't be
   * toggled off, internally.
   */
  manageColumns?: {
    columns: LwDataViewManageColumn[];
    onApply: (columns: ColumnManagementModalColumn[]) => void;
    onReset: () => void;
  };
};

export type LwDataViewProps = LwDataViewOwnedProps &
  Omit<
    DataViewTableBasicProps,
    'variant' | 'columns' | 'rows' | 'bodyStates' | 'headStates' | 'isSticky' | 'isTreeTable'
  >;

// ─── Content-sort helpers (module-scope, pure — no component state) ───────────

/** Cells for a row, regardless of which `LwDataViewTr` shape (bare array or `{row}`) was used. */
function getRowCells(row: LwDataViewTr): LwDataViewTd[] {
  return isDataViewTrObject(row) ? (row.row as LwDataViewTd[]) : (row as LwDataViewTd[]);
}

/** A cell's comparable value: explicit `sortValue`, else its own content when
 * that's a string/number, else `''` (ties — stable sort keeps original order). */
function getCellSortValue(cell: LwDataViewTd | undefined): string | number {
  if (cell == null) return '';
  if (isDataViewTdObject(cell)) {
    const sortValue = (cell.props as { sortValue?: string | number } | undefined)?.sortValue;
    if (sortValue !== undefined) return sortValue;
    return typeof cell.cell === 'string' || typeof cell.cell === 'number' ? cell.cell : '';
  }
  return typeof cell === 'string' || typeof cell === 'number' ? cell : '';
}

/** Numeric compare for numbers; locale-aware natural compare for strings (so
 * "Item 9" sorts before "Item 10"). Mixed types fall back to string compare. */
function compareSortValues(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/** `sortValue` is Lightwell-owned, read by the sort step above — strip it before
 * PF's `Td` ever sees the cell, same as `isSortable` is stripped from columns. */
function stripCellSortValue(cell: LwDataViewTd): DataViewTd {
  if (isDataViewTdObject(cell)) {
    const { sortValue, ...restProps } =
      (cell.props as { sortValue?: string | number } | undefined) ?? {};
    void sortValue; // destructured only to exclude it from restProps
    return { cell: cell.cell, props: restProps } as DataViewTd;
  }
  return cell as DataViewTd;
}

function stripRowSortValues(row: LwDataViewTr): DataViewTr {
  if (isDataViewTrObject(row)) {
    return { ...row, row: row.row.map(stripCellSortValue) } as DataViewTr;
  }
  return (row as LwDataViewTd[]).map(stripCellSortValue) as unknown as DataViewTr;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Kit **assembly unit** — `data-view/table`. Full data-view surface with
 * built-in toolbar, sort, empty-state, and drawer panel support.
 *
 * - **Toolbar** — opt-out: pass `search` / `pagination` / `panelToggle` to get
 *   the toolbar rendered internally. Hidden during loading automatically.
 * - **State** — pass `isLoading` and let the assembly derive `loading` / `empty`
 *   states automatically. Explicit `activeState` available for callers using
 *   `useTableActiveState` hooks or needing error state.
 * - **Sort** — off by default (a half-working sort against server-paginated
 *   data silently produces wrong cross-page ordering). Opt in per-column via
 *   `LwDataViewTh.props.isSortable = true` once the call site owns correct
 *   full-dataset ordering. Pass `onSortChange` to react to sort changes
 *   (e.g., for API-driven sort).
 * - **Empty state** — built-in when `rows` is empty and not loading; configure
 *   copy and clear-filters via `emptyState`. Override in-table via `bodyStates`.
 * - **Loading skeleton** — built-in: `SkeletonTableBody` renders automatically
 *   when loading; override via `bodyStates[DataViewState.loading]`.
 * - **Panel** — `panelToggle` drives both the toolbar button and the drawer
 *   expanded/close state; no need to pass `isPanelExpanded` or `onPanelClose` separately.
 * - **Visual defaults** — `gridBreakPoint`, `isStriped`, `isNoPlainOnGlass`
 *   come from `components.config.ts`; override per call site as needed.
 *
 * See `../ROADMAP.md` for family context.
 */
export function LwDataView({
  isLoading,
  isPlaceholderData,
  activeState,
  columns,
  rows,
  bodyStates,
  headStates,
  emptyState,
  onSortChange,
  search,
  pagination,
  isResident,
  panelToggle,
  toolbarSlot,
  showBottomPagination,
  isCompact,
  isCardless,
  isSticky,
  children,
  footer,
  selection,
  wrapperClassName,
  wrapperStyle,
  containerOuiaId,
  panel,
  panelHead,
  onPanelClose,
  isPanelExpanded,
  panelProps,
  responsive,
  manageColumns,
  ...rest
}: LwDataViewProps) {
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const {
    isCompact: defaultCompact,
    isCardless: defaultCardless,
    defaultPerPage,
    builtInPaginationItemProps,
    ...pfDefaults
  } = getLwDataViewDefaults();
  const compact = isCompact ?? defaultCompact ?? false;
  const cardless = isCardless ?? defaultCardless ?? false;

  // ─── Active state derivation ──────────────────────────────────────────────
  // Explicit `activeState` wins (backward compat for callers using
  // useTableActiveState hooks). When absent, the assembly derives from `isLoading`
  // and `rows`: loading → skeleton; empty rows → empty state; else normal render.
  const derivedActiveState: DataViewState | undefined = (() => {
    if (isLoading) return DataViewState.loading;
    if (rows.length === 0) return DataViewState.empty;
    return undefined;
  })();
  const resolvedActiveState = activeState ?? derivedActiveState;

  // ─── Sort state (internal) ────────────────────────────────────────────────
  // Sort is off by default — call sites opt in per-column via
  // `LwDataViewTh.props.isSortable = true`, only once they own correct
  // full-dataset ordering (resident data, or API-driven sort via
  // `onSortChange`). The assembly owns the sort indicator state;
  // `onSortChange` is the optional escape hatch for call sites that need to
  // react (e.g., to re-fetch sorted data from an API).
  const [activeSort, setActiveSort] = useState<
    | {
        columnIndex: number;
        direction: 'asc' | 'desc';
      }
    | undefined
  >(undefined);

  const handleSortColumn = useCallback(
    (columnIndex: number, direction: 'asc' | 'desc') => {
      setActiveSort({ columnIndex, direction });
      onSortChange?.(columnIndex, direction);
    },
    [onSortChange],
  );

  // ─── Sort injection ───────────────────────────────────────────────────────
  // Injects PF sort props only into columns with `isSortable === true`.
  // Strips `isSortable` before PF sees the column definitions.
  const processedColumns: DataViewTh[] = useMemo(
    () =>
      (columns as LwDataViewTh[]).map((col, idx) => {
        if (!col || typeof col !== 'object' || !('cell' in col)) {
          return col as unknown as DataViewTh;
        }
        const { isSortable, ...colProps } = col.props ?? {};
        if (isSortable !== true) {
          // Default: not opted in — strip `isSortable` flag, pass other props through.
          return { cell: col.cell, props: colProps } as DataViewTh;
        }
        return {
          cell: col.cell,
          props: {
            ...colProps,
            sort: {
              columnIndex: idx,
              sortBy: {
                index: activeSort?.columnIndex,
                direction: activeSort?.direction,
              },
              onSort: (_event: unknown, _columnIndex: number, direction: string) => {
                handleSortColumn(idx, direction as 'asc' | 'desc');
              },
            },
          },
        } as DataViewTh;
      }),
    [columns, activeSort, handleSortColumn],
  );

  // ─── Content-based sort (D16) ─────────────────────────────────────────────
  // A table sorts content — not business logic. By the time a row reaches
  // `LwDataView`, hydration already decided each cell's true orderable value;
  // there is nothing left to invoke here except a plain comparator. Reorders
  // already-resident `rows` directly: no page-side comparator, no callback
  // required for any column whose cell is a string/number or that supplies
  // `sortValue`. `onSortChange` (above) still fires alongside this, for
  // callers whose dataset isn't fully resident (server-paginated) and need
  // to trigger a re-fetch with a sort param.
  const sortedRows: DataViewTr[] = useMemo(() => {
    const ordered = (() => {
      if (!activeSort) return rows;
      const { columnIndex, direction } = activeSort;
      const decorated = rows.map((row, index) => ({
        row,
        index,
        value: getCellSortValue(getRowCells(row)[columnIndex]),
      }));
      decorated.sort((a, b) => {
        const cmp = compareSortValues(a.value, b.value);
        const signed = direction === 'asc' ? cmp : -cmp;
        return signed !== 0 ? signed : a.index - b.index; // stable tiebreaker
      });
      return decorated.map((d) => d.row);
    })();
    // `sortValue` is Lightwell-owned — strip it before PF's `Td` ever sees the
    // cell, regardless of whether this column is the active sort.
    return ordered.map(stripRowSortValues);
  }, [rows, activeSort]);

  // ─── Responsive default ───────────────────────────────────────────────────
  // When `panel` is provided, default to responsive `{}` (overlay below `2xl`,
  // inline at `2xl`+). Pass `responsive={false}` to keep a static inline drawer.
  const resolvedResponsive: LwDrawerResponsiveConfig | undefined = panel
    ? responsive === false
      ? undefined
      : (responsive ?? {})
    : responsive === false
      ? undefined
      : responsive;

  // ─── Panel expanded: breakpoint-owned default, call-site override ────────
  // Presentational state — a page should never need to decide whether the
  // panel starts open (D15). Uncontrolled by default: seed expanded state
  // from the active breakpoint (open at/above `responsive.inline`, default
  // `'2xl'`) and reset it whenever the viewport crosses that threshold,
  // discarding any manual toggle made within the prior breakpoint class —
  // the same behavior pages used to hand-roll individually before this.
  // A call site that passes `panelToggle.isExpanded` or `isPanelExpanded`
  // explicitly takes full control (controlled mode) — the escape hatch for
  // the rare case a page genuinely needs to own this.
  const bp = useLwBreakpoint();
  const isDefaultExpanded = resolvedResponsive
    ? isBreakpointAtLeast(bp, resolvedResponsive.inline ?? '2xl')
    : true;

  const [internalExpanded, setInternalExpanded] = useState(isDefaultExpanded);
  const prevDefaultExpandedRef = useRef(isDefaultExpanded);
  useEffect(() => {
    if (isDefaultExpanded !== prevDefaultExpandedRef.current) {
      prevDefaultExpandedRef.current = isDefaultExpanded;
      setInternalExpanded(isDefaultExpanded);
    }
  }, [isDefaultExpanded]);
  const toggleInternalExpanded = useCallback(() => setInternalExpanded((prev) => !prev), []);

  const callerIsExpanded = panelToggle?.isExpanded ?? isPanelExpanded;
  const isPanelControlled = callerIsExpanded !== undefined;
  const resolvedIsPanelExpanded = isPanelControlled ? callerIsExpanded! : internalExpanded;
  const resolvedOnPanelClose =
    panelToggle?.onToggle ??
    onPanelClose ??
    (isPanelControlled ? undefined : toggleInternalExpanded);

  // Concrete panelToggle handed to the built-in toolbar — resolves the
  // optional `isExpanded`/`onToggle` above into values the toggle button
  // can actually render/call, whether the call site took control or not.
  const resolvedPanelToggle = panelToggle
    ? {
        isExpanded: resolvedIsPanelExpanded,
        onToggle: panelToggle.onToggle ?? toggleInternalExpanded,
        label: panelToggle.label,
      }
    : undefined;

  // ─── Empty state ──────────────────────────────────────────────────────────
  const {
    [DataViewState.empty]: callerEmptyBody,
    [DataViewState.loading]: callerLoadingBody,
    ...otherBodyStates
  } = bodyStates ?? {};
  const useExternalEmptyState = resolvedActiveState === DataViewState.empty && !callerEmptyBody;
  // True empty = nothing to show AND nothing the user could clear. Filtering
  // chrome (toolbar + panel) is meaningless there, so it is not rendered. A
  // caller signals "filters are active" via `emptyState.hasActiveFilters`
  // or a non-empty `search.value`;
  // otherwise the zero rows are the real data. A positive
  // `pagination.itemCount` means results exist beyond this (empty) page, so
  // the pagination controls must stay reachable. Placeholder rows are never
  // the real data, so they are not true empty either.
  const hasActiveFilters = emptyState?.hasActiveFilters ?? false;
  const isTrueEmpty =
    useExternalEmptyState &&
    !isPlaceholderData &&
    !hasActiveFilters &&
    !search?.value &&
    !((pagination?.itemCount ?? 0) > 0);
  // Reset / search live in the toolbar that true empty unmounts. If one of them
  // had focus, the browser drops it to <body>; hand it to the empty state so
  // keyboard and screen-reader users land on the new content, not the page top.
  // Only on the filtered → true-empty transition, and only when focus was lost.
  const emptyStateId = useId();
  const wasTrueEmptyRef = useRef(isTrueEmpty);
  useEffect(() => {
    const becameTrueEmpty = isTrueEmpty && !wasTrueEmptyRef.current;
    wasTrueEmptyRef.current = isTrueEmpty;
    if (!becameTrueEmpty) return;
    const active = document.activeElement;
    if (!active || active === document.body) {
      document.getElementById(emptyStateId)?.focus();
    }
  }, [isTrueEmpty, emptyStateId]);
  // Pass activeState=undefined so PF renders an empty tbody (headers stay visible)
  // rather than activating the in-table body-state slot.
  const tableActiveState = useExternalEmptyState ? undefined : resolvedActiveState;

  // ─── Pagination: uncontrolled by default, call-site override ─────────────
  // Presentational state — a page should never need to hand-roll
  // `useState(1)` just to turn pagination on. Uncontrolled unless the call
  // site supplies `page`/`onSetPage` (or `perPage`/`onPerPageSelect`)
  // explicitly — the escape hatch for server-paginated data that needs to
  // know when the page changes to refetch (e.g. Beacon).
  const [internalPage, setInternalPage] = useState(1);
  const [internalPerPage, setInternalPerPage] = useState(defaultPerPage ?? 10);
  const requestedPage = pagination?.page ?? internalPage;
  const resolvedPerPage = pagination?.perPage ?? internalPerPage;

  const resolvedPagination: LwDataViewPaginationProps | undefined = pagination
    ? {
        ...pagination,
        // Resident rows are the whole result set, so the assembly knows the
        // total — a call site has nothing to say about it.
        itemCount: isResident ? rows.length : (pagination.itemCount ?? 0),
        page: isResident
          ? Math.max(1, Math.min(requestedPage, Math.ceil(rows.length / resolvedPerPage)))
          : requestedPage,
        perPage: resolvedPerPage,
        onSetPage: pagination.onSetPage ?? ((_event, newPage) => setInternalPage(newPage)),
        onPerPageSelect:
          pagination.onPerPageSelect ??
          ((_event, newPerPage, newPage) => {
            setInternalPerPage(newPerPage);
            setInternalPage(newPage);
          }),
      }
    : undefined;

  // ─── Resident paging ──────────────────────────────────────────────────────
  // Slice *after* the sort above, never before: sorting a pre-sliced page
  // reorders that page only, leaving the rest of the set where it was. Pages
  // that slice their own resident rows reintroduce exactly that bug, which is
  // why `isResident` hands the whole set over instead.
  const residentPage = resolvedPagination?.page;
  const residentPerPage = resolvedPagination?.perPage;
  const pagedRows: DataViewTr[] = useMemo(() => {
    if (!isResident || !residentPage || !residentPerPage) return sortedRows;
    const start = (residentPage - 1) * residentPerPage;
    return sortedRows.slice(start, start + residentPerPage);
  }, [sortedRows, isResident, residentPage, residentPerPage]);

  // ─── Default loading skeleton ─────────────────────────────────────────────
  // When loading and no caller override, render SkeletonTableBody with sensible
  // dimensions derived from the pagination perPage and column count.
  const defaultLoadingBody = (
    <SkeletonTableBody
      rowsCount={resolvedPagination?.perPage ?? 5}
      columnsCount={processedColumns.length}
    />
  );

  const mergedBodyStates: Partial<Record<DataViewState, ReactNode>> = {
    [DataViewState.loading]: callerLoadingBody ?? defaultLoadingBody,
    ...otherBodyStates,
    ...(callerEmptyBody ? { [DataViewState.empty]: callerEmptyBody } : {}),
  };

  // True empty never borrows the filtered-to-zero copy ("Reset filters…").
  const emptyTitleText =
    (isTrueEmpty ? emptyState?.noData?.titleText : emptyState?.titleText) ?? 'No results found';
  const emptyBodyText = isTrueEmpty ? emptyState?.noData?.bodyText : emptyState?.bodyText;
  const emptyStateNode = useExternalEmptyState ? (
    <LwEmptyState
      headingLevel='h2'
      icon={SearchIcon}
      id={emptyStateId}
      tabIndex={isTrueEmpty ? -1 : undefined}
      titleText={emptyTitleText}
      variant={EmptyStateVariant.sm}
    >
      {emptyBodyText ? <EmptyStateBody>{emptyBodyText}</EmptyStateBody> : null}
      {!isTrueEmpty && emptyState?.onClearFilters ? (
        <EmptyStateFooter>
          <EmptyStateActions>
            <LwButton variant='primary' onClick={emptyState.onClearFilters}>
              Reset filters
            </LwButton>
          </EmptyStateActions>
        </EmptyStateFooter>
      ) : null}
    </LwEmptyState>
  ) : null;

  // ─── Built-in toolbar ─────────────────────────────────────────────────────
  // Rendered when the caller passes any of search / pagination / panelToggle.
  // Hidden during loading — the assembly manages visibility so callers don't
  // need to gate it manually. Top pagination defaults to compact density.
  const hasBuiltInToolbar = !!(search || pagination || panelToggle);
  const isLoadingState = resolvedActiveState === DataViewState.loading;

  const builtInToolbarNode =
    hasBuiltInToolbar && !isLoadingState && !isTrueEmpty ? (
      <LwDataViewToolbar
        search={search}
        pagination={resolvedPagination ? { isCompact: true, ...resolvedPagination } : undefined}
        paginationItemProps={builtInPaginationItemProps}
        panelToggle={resolvedPanelToggle}
        manageColumns={!!manageColumns}
      >
        {toolbarSlot}
      </LwDataViewToolbar>
    ) : null;

  // ─── Built-in bottom pagination ───────────────────────────────────────────
  // Shown by default when pagination data is present, not loading, and items
  // exist. Pass `showBottomPagination={false}` to suppress.
  const showBottomToolbar =
    showBottomPagination !== false &&
    !!resolvedPagination &&
    !isLoadingState &&
    (resolvedPagination.itemCount ?? 0) > 0;

  const builtInBottomToolbarNode = showBottomToolbar ? (
    <LwDataViewToolbar pagination={{ ...resolvedPagination, variant: 'bottom' }} />
  ) : null;

  // ─── Table props ──────────────────────────────────────────────────────────
  // `isSticky` is deliberately NOT forwarded here — see the `tableNode`
  // comment below for why.
  const tableProps = mergeComponentProps(pfDefaults, {
    ...rest,
    variant: compact ? ('compact' as const) : undefined,
    // PF adds the row toggle to the body only; supply its matching header.
    columns:
      rest.isExpandable &&
      !(rest.expandedRows?.length && rest.expandedRows.every((row) => row.columnId !== undefined))
        ? [
            {
              cell: '',
              props: { screenReaderText: 'Expand row', className: 'lw-c-data-view__expand-header' },
            },
            ...processedColumns,
          ]
        : processedColumns,
    rows: pagedRows,
    bodyStates: mergedBodyStates,
    headStates,
  });

  const contextValue = {
    onOpenManageColumns: manageColumns ? () => setIsColumnModalOpen(true) : undefined,
  };

  // ─── Column-management catalog derivation (D20) ───────────────────────────
  // Callers hydrate `manageColumns.columns` as a plain catalog; the
  // untoggleable rule (first column, or any sticky column, can't be hidden
  // without breaking the table) is a table-shape fact the assembly already
  // knows from `props.isStickyColumn` — computing it per call site was the
  // same uncontrolled-state gap `pagination`/`panelToggle` had before D15.
  const derivedAppliedColumns: ColumnManagementModalColumn[] = useMemo(
    () =>
      manageColumns?.columns.map((column, index) => ({
        key: column.key,
        title: column.cell,
        isShown: column.isShown,
        isShownByDefault: column.isShownByDefault,
        isUntoggleable: index === 0 || column.props?.isStickyColumn === true,
      })) ?? [],
    [manageColumns],
  );

  // ─── DataView branches ────────────────────────────────────────────────────
  // `isSticky` is the opt-in signal (verified layout context, not auto-derived
  // — see skill) that sticky COLUMNS are in play — horizontal scroll via
  // Outer/InnerScrollContainer, not vertical sticky header.
  //
  // `DataViewTableBasic` (what `DataViewTable` always renders underneath —
  // confirmed by reading PF's source) couples its OWN `isSticky` prop to
  // BOTH concerns at once: it wraps in Outer/InnerScrollContainer *and*
  // unconditionally forces `isStickyHeader: true` on the underlying `Table`,
  // with no way to opt out of just the header half. Sticky header only means
  // anything with a height-bounded scroll context (it sticks relative to its
  // own scrolling ancestor); table height isn't bounded today, so sticky
  // header would be a no-op at best — held pending that refactor (D26), not
  // shipped half-working. So `tableProps` (above) never includes `isSticky`
  // — `DataViewTableBasic` always takes its plain, unwrapped `<Table>`
  // branch — and the scroll-wrapper/sticky-column behavior is built here
  // instead, only when `isSticky` is set.
  //
  // The empty state nests inside `OuterScrollContainer`, as a sibling of
  // `InnerScrollContainer` — not inside the scrollable inner region itself
  // (it doesn't need horizontal scroll), but still part of the same table
  // surface, so it stays coupled to the table's column width rather than
  // the full drawer+panel row's width once a `panel` is present.
  const tableNode = isTrueEmpty ? null : <DataViewTable {...tableProps} />;

  // True empty: no rows and nothing to clear — column headers would only label
  // an empty grid, so render the empty state alone.
  const tableAndEmptyState = isTrueEmpty ? (
    emptyStateNode
  ) : isSticky ? (
    <OuterScrollContainer>
      <InnerScrollContainer>{tableNode}</InnerScrollContainer>
      {emptyStateNode}
    </OuterScrollContainer>
  ) : (
    <>
      {tableNode}
      {emptyStateNode}
    </>
  );

  const tableSurface =
    panel && !isTrueEmpty ? (
      <LwDrawer
        isExpanded={resolvedIsPanelExpanded}
        isInline={!resolvedResponsive}
        position='start'
        panelContent={panel}
        panelHead={panelHead}
        onPanelClose={resolvedOnPanelClose}
        panelProps={panelProps}
        responsive={resolvedResponsive}
      >
        {tableAndEmptyState}
      </LwDrawer>
    ) : (
      tableAndEmptyState
    );

  // PF's DataView wraps every top-level child in a StackItem via
  // Children.map, including falsy ones (`false`, `undefined`) — an absent
  // slot still produces an empty StackItem that eats space. Filter before
  // handing children to DataView so Children.map never sees the gaps.
  const dataViewChildren = (
    [
      ['toolbar', cardless && builtInToolbarNode],
      ['children', children],
      ['table', tableSurface],
      ['bottom-toolbar', builtInBottomToolbarNode],
      ['footer', footer],
    ] as const
  )
    .filter(([, node]) => Boolean(node))
    .map(([key, node]) => <Fragment key={key}>{node}</Fragment>);

  const dataViewElement = (
    <DataView
      activeState={tableActiveState}
      selection={selection}
      ouiaId={containerOuiaId}
      className={mergeClassNames('lw-c-data-view', wrapperClassName)}
      style={wrapperStyle}
    >
      {dataViewChildren}
    </DataView>
  );

  // Default-on Card wrapper (D19): CardHeader hosts the built-in toolbar,
  // CardBody hosts the full data-view surface. The rounded-corner/surface
  // chrome this restores came free from PF Card defaults before D12 let
  // LwDataView render directly in PageSection — now a kit default instead
  // of page-local JSX. Opt out via `isCardless` for pages that already
  // provide their own container chrome.
  const dataView = cardless ? (
    dataViewElement
  ) : (
    <LwCard className='lw-c-data-view-card'>
      {builtInToolbarNode && <CardHeader>{builtInToolbarNode}</CardHeader>}
      <CardBody>{dataViewElement}</CardBody>
    </LwCard>
  );

  return (
    <DataViewInternalContext.Provider value={contextValue}>
      {dataView}
      {manageColumns && (
        <ColumnManagementModal
          isOpen={isColumnModalOpen}
          onClose={() => setIsColumnModalOpen(false)}
          appliedColumns={derivedAppliedColumns}
          applyColumns={(cols) => {
            manageColumns.onApply(cols);
            setIsColumnModalOpen(false);
          }}
          onReset={manageColumns.onReset}
        />
      )}
    </DataViewInternalContext.Provider>
  );
}

export default LwDataView;
