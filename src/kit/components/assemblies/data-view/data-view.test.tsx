import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataViewState } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { Tbody, Td, Tr } from '@patternfly/react-table';

import { LwDataView } from './data-view';
import { LwDataViewToolbar } from './data-view-toolbar/data-view-toolbar';

const columns = [{ cell: 'Name' }, { cell: 'Status' }];
const rows = [
  [{ cell: 'Row one' }, { cell: 'OK' }],
  [{ cell: 'Row two' }, { cell: 'OK' }],
];

it('renders rows by default (non-compact)', () => {
  render(<LwDataView aria-label='Example table' columns={columns} rows={rows} />);

  const table = screen.getByRole('grid', { name: 'Example table' });
  expect(table).toBeInTheDocument();
  expect(table).not.toHaveClass('pf-m-compact');
  expect(screen.getByText('Row one')).toBeInTheDocument();
  expect(screen.getByText('Row two')).toBeInTheDocument();
});

it('opts into compact density only when isCompact is set', () => {
  render(<LwDataView aria-label='Compact table' columns={columns} rows={rows} isCompact />);

  expect(screen.getByRole('grid', { name: 'Compact table' })).toHaveClass('pf-m-compact');
});

// ─── Sticky columns ────────────────────────────────────────────────────────────
// `isSticky` means sticky COLUMNS (horizontal scroll via Outer/InnerScroll-
// Container), not sticky header — `DataViewTableBasic` (what `DataViewTable`
// always renders underneath) couples its own `isSticky` to both at once with
// no way to opt out of just the header half, and header stickiness needs a
// height-bounded scroll context LwDataView doesn't have yet (D26, held). So
// `isSticky` is never forwarded into `DataViewTableBasic`'s own prop — the
// wrapper is built here instead, and sticky header never activates.

it('renders exactly one scroll-wrapper pair when isSticky is set', () => {
  const { container } = render(
    <LwDataView aria-label='Sticky table' columns={columns} rows={rows} isSticky />,
  );

  expect(container.querySelectorAll('.pf-v6-c-scroll-outer-wrapper')).toHaveLength(1);
  expect(container.querySelectorAll('.pf-v6-c-scroll-inner-wrapper')).toHaveLength(1);
});

it('renders no scroll wrappers when isSticky is not set', () => {
  const { container } = render(
    <LwDataView aria-label='Plain table' columns={columns} rows={rows} />,
  );

  expect(container.querySelector('.pf-v6-c-scroll-outer-wrapper')).not.toBeInTheDocument();
});

it('does not enable sticky header when isSticky is set', () => {
  render(<LwDataView aria-label='Sticky table' columns={columns} rows={rows} isSticky />);

  expect(screen.getByRole('grid', { name: 'Sticky table' })).not.toHaveClass('pf-m-sticky-header');
});

it('nests the default empty state inside the outer scroll wrapper, as a sibling of the inner wrapper, when isSticky is set', () => {
  const { container } = render(
    <LwDataView
      aria-label='Sticky empty table'
      columns={columns}
      rows={[]}
      activeState={DataViewState.empty}
      isSticky
    />,
  );

  const outer = container.querySelector('.pf-v6-c-scroll-outer-wrapper');
  expect(outer).toBeInTheDocument();
  expect(within(outer as HTMLElement).getByText('No results found')).toBeInTheDocument();
  // Sibling of the inner wrapper (not nested inside the scrollable region),
  // both direct children of the outer wrapper.
  const inner = container.querySelector('.pf-v6-c-scroll-inner-wrapper');
  const emptyState = container.querySelector('.pf-v6-c-empty-state');
  expect(inner?.parentElement).toBe(outer);
  expect(emptyState?.parentElement).toBe(outer);
});

// ─── Card wrapper (D19) ────────────────────────────────────────────────────────
// Default-on: the surface chrome VulnerabilityTable.tsx used to supply via a
// hand-rolled Card should come free from the assembly, not page-local JSX.

it('wraps the table in a Card by default', () => {
  const { container } = render(
    <LwDataView aria-label='Carded table' columns={columns} rows={rows} />,
  );

  expect(container.querySelector('.pf-v6-c-card')).toBeInTheDocument();
  expect(container.querySelector('.pf-v6-c-card .pf-v6-c-table')).toBeInTheDocument();
});

it('renders without a Card when isCardless is set', () => {
  const { container } = render(
    <LwDataView aria-label='Cardless table' columns={columns} rows={rows} isCardless />,
  );

  expect(container.querySelector('.pf-v6-c-card')).not.toBeInTheDocument();
});

it('puts the built-in toolbar in CardHeader and the table in CardBody', () => {
  const { container } = render(
    <LwDataView
      aria-label='Carded table with toolbar'
      columns={columns}
      rows={rows}
      search={{ value: '', onChange: () => {}, placeholder: 'Search items' }}
    />,
  );

  const header = container.querySelector('.pf-v6-c-card__header');
  const body = container.querySelector('.pf-v6-c-card__body');
  expect(within(header as HTMLElement).getByPlaceholderText('Search items')).toBeInTheDocument();
  expect(body?.querySelector('.pf-v6-c-table')).toBeInTheDocument();
  expect(header?.querySelector('.pf-v6-c-table')).not.toBeInTheDocument();
});

it('renders no CardHeader when there is no built-in toolbar', () => {
  const { container } = render(
    <LwDataView aria-label='Carded table, no toolbar' columns={columns} rows={rows} />,
  );

  expect(container.querySelector('.pf-v6-c-card__header')).not.toBeInTheDocument();
});

// ─── Default empty state ─────────────────────────────────────────────────────

it('renders the default empty state below the table headers when activeState is empty', () => {
  render(
    <LwDataView
      aria-label='Empty table'
      columns={columns}
      rows={[]}
      activeState={DataViewState.empty}
    />,
  );

  // Table headers still present
  expect(screen.getByRole('grid', { name: 'Empty table' })).toBeInTheDocument();
  // Default empty state visible
  expect(screen.getByText('No results found')).toBeInTheDocument();
});

it('nests the default empty state inside the drawer, as a sibling of the table, when panel is set', () => {
  const { container } = render(
    <LwDataView
      aria-label='Empty table'
      columns={columns}
      rows={[]}
      activeState={DataViewState.empty}
      panel={<div>Panel body</div>}
    />,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  expect(drawer).toBeInTheDocument();
  // Must be inside the drawer's content area (sibling of the table), not a
  // sibling of the whole drawer+panel row — otherwise it loses its coupling
  // to the table's column width once a panel is present.
  expect(within(drawer as HTMLElement).getByText('No results found')).toBeInTheDocument();
});

it('renders custom titleText when emptyState.titleText is provided', () => {
  render(
    <LwDataView
      aria-label='Empty table'
      columns={columns}
      rows={[]}
      activeState={DataViewState.empty}
      emptyState={{ titleText: 'No vulnerabilities match the current filters' }}
    />,
  );

  expect(screen.getByText('No vulnerabilities match the current filters')).toBeInTheDocument();
});

it('renders bodyText when emptyState.bodyText is provided', () => {
  render(
    <LwDataView
      aria-label='Empty table'
      columns={columns}
      rows={[]}
      activeState={DataViewState.empty}
      emptyState={{ bodyText: 'Reset filters to show more results.' }}
    />,
  );

  expect(screen.getByText('Reset filters to show more results.')).toBeInTheDocument();
});

it('renders a Reset filters button and calls onClearFilters when clicked', async () => {
  const user = userEvent.setup();
  const handleClear = jest.fn();

  render(
    <LwDataView
      aria-label='Empty table'
      columns={columns}
      rows={[]}
      activeState={DataViewState.empty}
      emptyState={{ onClearFilters: handleClear }}
    />,
  );

  const btn = screen.getByRole('button', { name: 'Reset filters' });
  expect(btn).toBeInTheDocument();
  await user.click(btn);
  expect(handleClear).toHaveBeenCalledTimes(1);
});

it('bodyStates[DataViewState.empty] overrides the default in-table when provided', () => {
  render(
    <LwDataView
      aria-label='Empty table'
      columns={columns}
      rows={[]}
      activeState={DataViewState.empty}
      bodyStates={{
        [DataViewState.empty]: (
          <Tbody>
            <Tr>
              <Td colSpan={columns.length}>Nothing here</Td>
            </Tr>
          </Tbody>
        ),
      }}
    />,
  );

  expect(screen.getByText('Nothing here')).toBeInTheDocument();
  expect(screen.queryByText('No results found')).not.toBeInTheDocument();
});

it('renders toolbar/chrome children above the table inside DataView', () => {
  render(
    <LwDataView aria-label='With chrome' columns={columns} rows={rows}>
      <div data-ouia-component-id='toolbar'>Toolbar</div>
    </LwDataView>,
  );

  expect(screen.getByTestId('toolbar')).toBeInTheDocument();
  expect(screen.getByRole('grid', { name: 'With chrome' })).toBeInTheDocument();
});

it('renders footer chrome after the table, still inside DataView', () => {
  render(
    <LwDataView
      aria-label='With footer'
      columns={columns}
      rows={rows}
      footer={<div data-ouia-component-id='bottom-toolbar'>Bottom toolbar</div>}
    >
      <div data-ouia-component-id='top-toolbar'>Top toolbar</div>
    </LwDataView>,
  );

  const topToolbar = screen.getByTestId('top-toolbar');
  const footer = screen.getByTestId('bottom-toolbar');
  const table = screen.getByRole('grid', { name: 'With footer' });

  expect(topToolbar.compareDocumentPosition(table)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(table.compareDocumentPosition(footer)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});

it('applies selection to the outer DataView so rows become selectable', () => {
  const selection = { onSelect: jest.fn(), isSelected: () => false };
  render(
    <LwDataView
      aria-label='Selectable table'
      columns={columns}
      rows={rows}
      selection={selection}
    />,
  );

  expect(screen.getAllByRole('checkbox')).toHaveLength(rows.length);
});

it('applies wrapperClassName/wrapperStyle/containerOuiaId to the outer DataView host, distinct from the inner table', () => {
  render(
    <LwDataView
      aria-label='Wrapped table'
      columns={columns}
      rows={rows}
      wrapperClassName='custom-wrapper'
      wrapperStyle={{ padding: 8 }}
      containerOuiaId='page-data-view'
    />,
  );

  const wrapper = document.querySelector('[data-ouia-component-id="page-data-view-stack"]');
  expect(wrapper).toBeInTheDocument();
  expect(wrapper).toHaveClass('custom-wrapper');
  expect(wrapper).toHaveStyle({ padding: '8px' });

  expect(
    document.querySelector('[data-ouia-component-id="DataViewTableBasic"]'),
  ).toBeInTheDocument();
});

// ─── Drawer (via LwDrawer) ───────────────────────────────────────────────────

it('renders without Drawer when panel is omitted', () => {
  const { container } = render(<LwDataView aria-label='No drawer' columns={columns} rows={rows} />);

  expect(container.querySelector('.pf-v6-c-drawer')).not.toBeInTheDocument();
  expect(screen.getByRole('grid', { name: 'No drawer' })).toBeInTheDocument();
});

it('wraps content in LwDrawer when panel is provided', () => {
  const { container } = render(
    <LwDataView
      aria-label='With drawer'
      columns={columns}
      rows={rows}
      panel={<div data-ouia-component-id='panel-content'>Panel</div>}
      isPanelExpanded
    />,
  );

  expect(container.querySelector('.pf-v6-c-drawer')).toBeInTheDocument();
  // Responsive is the default when panel is provided — drawer is overlay at lg (not inline).
  expect(container.querySelector('.pf-m-inline')).not.toBeInTheDocument();
  expect(screen.getByTestId('panel-content')).toBeInTheDocument();
  expect(screen.getByRole('grid', { name: 'With drawer' })).toBeInTheDocument();
});

it('renders panel as collapsed when isPanelExpanded is false', () => {
  const { container } = render(
    <LwDataView
      aria-label='Collapsed drawer'
      columns={columns}
      rows={rows}
      panel={<div>Panel</div>}
      isPanelExpanded={false}
    />,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  expect(drawer).toBeInTheDocument();
  expect(drawer).not.toHaveClass('pf-m-expanded');
});

it('renders panel as expanded when isPanelExpanded is true', () => {
  const { container } = render(
    <LwDataView
      aria-label='Expanded drawer'
      columns={columns}
      rows={rows}
      panel={<div>Panel</div>}
      isPanelExpanded
    />,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  expect(drawer).toBeInTheDocument();
  expect(drawer).toHaveClass('pf-m-expanded');
});

it('accepts any ReactNode as panel content (not just filter panel)', () => {
  render(
    <LwDataView
      aria-label='Custom panel'
      columns={columns}
      rows={rows}
      panel={<aside aria-label='Detail view'>Custom content</aside>}
      isPanelExpanded
    />,
  );

  expect(screen.getByRole('complementary', { name: 'Detail view' })).toBeInTheDocument();
  expect(screen.getByText('Custom content')).toBeInTheDocument();
});

it('renders panelHead in DrawerHead', () => {
  render(
    <LwDataView
      aria-label='Panel head'
      columns={columns}
      rows={rows}
      panel={<div>Body</div>}
      panelHead={<span>Filters</span>}
      isPanelExpanded
    />,
  );

  expect(screen.getByText('Filters')).toBeInTheDocument();
});

it('renders close button when onPanelClose is provided', async () => {
  const user = userEvent.setup();
  const handleClose = jest.fn();

  render(
    <LwDataView
      aria-label='Closeable panel'
      columns={columns}
      rows={rows}
      panel={<div>Body</div>}
      onPanelClose={handleClose}
      isPanelExpanded
    />,
  );

  const closeButton = screen.getByRole('button', { name: 'Close drawer panel' });
  expect(closeButton).toBeInTheDocument();
  await user.click(closeButton);
  expect(handleClose).toHaveBeenCalledTimes(1);
});

// ─── Drawer structure ────────────────────────────────────────────────────────

it('drawer wraps only the table, not toolbar or footer', () => {
  const { container } = render(
    <LwDataView
      aria-label='Scoped drawer'
      columns={columns}
      rows={rows}
      panel={<div>Panel</div>}
      isPanelExpanded
      footer={<div data-ouia-component-id='bottom-bar'>Bottom</div>}
    >
      <div data-ouia-component-id='top-bar'>Top</div>
    </LwDataView>,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  const topBar = screen.getByTestId('top-bar');
  const bottomBar = screen.getByTestId('bottom-bar');

  // Toolbar and footer are siblings to the drawer, not children of it
  expect(drawer).toBeInTheDocument();
  expect(drawer!.contains(topBar)).toBe(false);
  expect(drawer!.contains(bottomBar)).toBe(false);

  // Table IS inside the drawer
  const table = screen.getByRole('grid', { name: 'Scoped drawer' });
  expect(drawer!.contains(table)).toBe(true);
});

// ─── Column management ───────────────────────────────────────────────────────

it('renders ColumnManagementModal (closed) when manageColumns is provided', () => {
  render(
    <LwDataView
      aria-label='Managed columns'
      columns={columns}
      rows={rows}
      manageColumns={{
        columns: [{ cell: 'Name', key: 'name', isShown: true, isShownByDefault: true }],
        onApply: jest.fn(),
        onReset: jest.fn(),
      }}
    />,
  );

  // Modal is present but closed (PF renders it in the DOM as hidden).
  expect(document.querySelector('.pf-v6-c-modal-box')).not.toBeInTheDocument();
  expect(screen.getByRole('grid', { name: 'Managed columns' })).toBeInTheDocument();
});

it('opens ColumnManagementModal when context onOpenManageColumns is called', async () => {
  const user = userEvent.setup();
  const handleApply = jest.fn();

  render(
    <LwDataView
      aria-label='Managed columns'
      columns={columns}
      rows={rows}
      manageColumns={{
        columns: [{ cell: 'Name', key: 'name', isShown: true, isShownByDefault: true }],
        onApply: handleApply,
        onReset: jest.fn(),
      }}
    >
      {/* Toolbar reads onOpenManageColumns from context */}
      <LwDataViewToolbar manageColumns />
    </LwDataView>,
  );

  await user.click(screen.getByRole('button', { name: 'Manage columns' }));
  expect(screen.getByRole('dialog', { name: /manage columns/i })).toBeInTheDocument();
});

it('calls onApply with new columns when the modal is saved', async () => {
  const user = userEvent.setup();
  const handleApply = jest.fn();

  render(
    <LwDataView
      aria-label='Managed columns'
      columns={columns}
      rows={rows}
      manageColumns={{
        columns: [{ cell: 'Name', key: 'name', isShown: true, isShownByDefault: true }],
        onApply: handleApply,
        onReset: jest.fn(),
      }}
    >
      <LwDataViewToolbar manageColumns />
    </LwDataView>,
  );

  await user.click(screen.getByRole('button', { name: 'Manage columns' }));
  await user.click(screen.getByRole('button', { name: /save/i }));

  expect(handleApply).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

// ─── Responsive drawer ──────────────────────────────────────────────────────
// JSDOM has no matchMedia → useLwBreakpoint returns 'lg'.
// Default inline breakpoint is '2xl', so at lg the drawer is overlay, not inline.

it('defaults to responsive overlay mode at lg when panel is provided', () => {
  const { container } = render(
    <LwDataView
      aria-label='Responsive drawer'
      columns={columns}
      rows={rows}
      panel={<div>Panel</div>}
      isPanelExpanded
    />,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  // Responsive is the default — overlay (not inline) at lg; inline kicks in at 2xl+.
  expect(drawer).not.toHaveClass('pf-m-inline');
  expect(drawer).toHaveClass('pf-m-expanded');
});

it('uses static inline drawer when responsive={false}', () => {
  const { container } = render(
    <LwDataView
      aria-label='Static drawer'
      columns={columns}
      rows={rows}
      panel={<div>Panel</div>}
      isPanelExpanded
      responsive={false}
    />,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  // Opt-out of responsive — always inline regardless of viewport.
  expect(drawer).toHaveClass('pf-m-inline');
});

// ─── Built-in toolbar ─────────────────────────────────────────────────────────

const paginationProps = {
  itemCount: 100,
  page: 1,
  perPage: 20,
  onSetPage: jest.fn(),
  onPerPageSelect: jest.fn(),
};

it('renders built-in toolbar with search input when search prop is provided', () => {
  render(
    <LwDataView
      aria-label='Toolbar table'
      columns={columns}
      rows={rows}
      search={{ value: '', onChange: jest.fn(), placeholder: 'Search items' }}
      pagination={paginationProps}
    />,
  );

  expect(screen.getByPlaceholderText('Search items')).toBeInTheDocument();
});

it('hides the built-in toolbar during loading state', () => {
  render(
    <LwDataView
      aria-label='Loading table'
      columns={columns}
      rows={[]}
      activeState={DataViewState.loading}
      search={{ value: '', onChange: jest.fn(), placeholder: 'Search items' }}
      pagination={paginationProps}
    />,
  );

  expect(screen.queryByPlaceholderText('Search items')).not.toBeInTheDocument();
});

it('renders bottom pagination by default when pagination has itemCount > 0', () => {
  render(
    <LwDataView
      aria-label='Default bottom pager table'
      columns={columns}
      rows={rows}
      pagination={paginationProps}
    />,
  );

  // Two navigation regions — top and bottom — both rendered by PF's Pagination.
  const paginators = screen.getAllByRole('navigation');
  expect(paginators.length).toBeGreaterThanOrEqual(2);
});

it('hides bottom pagination when showBottomPagination={false}', () => {
  render(
    <LwDataView
      aria-label='No bottom pager table'
      columns={columns}
      rows={rows}
      pagination={paginationProps}
      showBottomPagination={false}
    />,
  );

  // Only the top pagination toolbar item.
  const paginators = screen.getAllByRole('navigation');
  expect(paginators.length).toBe(1);
});

it('suppresses bottom pagination when itemCount is 0', () => {
  render(
    <LwDataView
      aria-label='Empty pager table'
      columns={columns}
      rows={[]}
      activeState={DataViewState.empty}
      pagination={{ ...paginationProps, itemCount: 0 }}
    />,
  );

  // Only the top pagination ToolbarItem (which is visibility-hidden on mobile)
  const paginators = screen.getAllByRole('navigation');
  expect(paginators.length).toBe(1);
});

// ─── Pagination: uncontrolled by default ──────────────────────────────────
// A page should never need to hand-roll `useState(1)` just to turn
// pagination on — omitting page/onSetPage is uncontrolled, not broken.

it('works uncontrolled with only itemCount — defaults perPage from components.config.ts', () => {
  render(
    <LwDataView
      aria-label='Uncontrolled pager'
      columns={columns}
      rows={rows}
      pagination={{ itemCount: 100 }}
    />,
  );

  // Default perPage is 10 (components.config.ts) — 100 items -> 10 pages.
  const currentPageInputs = screen.getAllByLabelText('Current page');
  expect(currentPageInputs[0]).toHaveValue(1);
  expect(currentPageInputs[0]).toHaveAttribute('max', '10');
});

it('advances the page via the built-in button and keeps top/bottom in sync — zero page-level state', async () => {
  const user = userEvent.setup();
  render(
    <LwDataView
      aria-label='Uncontrolled pager'
      columns={columns}
      rows={rows}
      pagination={{ itemCount: 100 }}
    />,
  );

  await user.click(screen.getAllByRole('button', { name: 'Go to next page' })[0]);

  for (const input of screen.getAllByLabelText('Current page')) {
    expect(input).toHaveValue(2);
  }
});

it('toolbarSlot content is rendered inside the built-in toolbar', () => {
  render(
    <LwDataView
      aria-label='Slot table'
      columns={columns}
      rows={rows}
      search={{ value: '', onChange: jest.fn() }}
      pagination={paginationProps}
      toolbarSlot={<div data-ouia-component-id='middle-slot'>Filter chips here</div>}
    />,
  );

  expect(screen.getByTestId('middle-slot')).toBeInTheDocument();
});

// ─── Sort ────────────────────────────────────────────────────────────────────
// Sort is always on by default — no prop required.

it('injects sort props into all columns by default', () => {
  render(<LwDataView aria-label='Sortable table' columns={columns} rows={rows} />);

  // PF renders sort buttons inside each sortable Th
  const sortButtons = screen.getAllByRole('button', { name: /Name|Status/i });
  expect(sortButtons.length).toBe(columns.length);
});

it('skips sort injection for columns with isSortable: false', () => {
  const mixedColumns = [{ cell: 'Name' }, { cell: 'Status', props: { isSortable: false } }];

  render(<LwDataView aria-label='Partial sort table' columns={mixedColumns} rows={rows} />);

  // Only "Name" gets a sort button; "Status" does not
  expect(screen.getByRole('button', { name: /Name/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Status/i })).not.toBeInTheDocument();
});

it('calls onSortChange with columnIndex and direction when a column header is clicked', async () => {
  const user = userEvent.setup();
  const handleSort = jest.fn();

  render(
    <LwDataView
      aria-label='Clickable sort table'
      columns={columns}
      rows={rows}
      onSortChange={handleSort}
    />,
  );

  await user.click(screen.getByRole('button', { name: /Name/i }));
  expect(handleSort).toHaveBeenCalledWith(0, expect.stringMatching(/asc|desc/));
});

// ─── Content-based sort (D16) ──────────────────────────────────────────────────
// Sort is content, not business logic — clicking a header must actually reorder
// rows, with zero page involvement for anything already resident.

function getBodyRowFirstCellTexts() {
  const grid = screen.getByRole('grid');
  return within(grid)
    .getAllByRole('row')
    .slice(1) // drop the header row
    .map((row) => within(row).getAllByRole('cell')[0].textContent);
}

const sortableColumns = [{ cell: 'Name' }, { cell: 'Score' }];
const sortableRows = [
  [{ cell: 'Charlie' }, { cell: 9 }],
  [{ cell: 'Alice' }, { cell: 20 }],
  [{ cell: 'Bob' }, { cell: 3 }],
];

it('reorders rows by column content on header click', async () => {
  const user = userEvent.setup();
  render(
    <LwDataView
      aria-label='Sortable content table'
      columns={sortableColumns}
      rows={sortableRows}
    />,
  );

  await user.click(screen.getByRole('button', { name: 'Name' }));

  expect(getBodyRowFirstCellTexts()).toEqual(['Alice', 'Bob', 'Charlie']);
});

it('reverses order on a second click of the same column', async () => {
  const user = userEvent.setup();
  render(
    <LwDataView
      aria-label='Sortable content table'
      columns={sortableColumns}
      rows={sortableRows}
    />,
  );

  const nameButton = screen.getByRole('button', { name: 'Name' });
  await user.click(nameButton);
  await user.click(nameButton);

  expect(getBodyRowFirstCellTexts()).toEqual(['Charlie', 'Bob', 'Alice']);
});

it('sorts numeric cell content numerically, not lexicographically', async () => {
  const user = userEvent.setup();
  const numericRows = [
    [{ cell: 'Row A' }, { cell: 10 }],
    [{ cell: 'Row B' }, { cell: 9 }],
  ];
  render(
    <LwDataView aria-label='Numeric sort table' columns={sortableColumns} rows={numericRows} />,
  );

  await user.click(screen.getByRole('button', { name: 'Score' }));

  // A lexicographic compare would put '10' before '9' — numeric compare must not.
  expect(getBodyRowFirstCellTexts()).toEqual(['Row B', 'Row A']);
});

it('sorts by an explicit sortValue when the rendered cell is not directly comparable', async () => {
  const user = userEvent.setup();
  const rankedColumns = [{ cell: 'Name' }, { cell: 'Severity' }];
  const rankedRows = [
    [{ cell: 'Low issue' }, { cell: <span>Minor</span>, props: { sortValue: 3 } }],
    [{ cell: 'High issue' }, { cell: <span>Critical</span>, props: { sortValue: 0 } }],
    [{ cell: 'Mid issue' }, { cell: <span>Moderate</span>, props: { sortValue: 2 } }],
  ];
  render(<LwDataView aria-label='Ranked sort table' columns={rankedColumns} rows={rankedRows} />);

  await user.click(screen.getByRole('button', { name: 'Severity' }));

  // Alphabetical compare of the labels would read Critical, Minor, Moderate — wrong.
  // sortValue (rank) must win: Critical(0), Moderate(2), Minor(3).
  expect(getBodyRowFirstCellTexts()).toEqual(['High issue', 'Mid issue', 'Low issue']);
});

// ─── Panel state consolidation ────────────────────────────────────────────────

it('derives drawer expanded state and close handler from panelToggle', async () => {
  const user = userEvent.setup();
  const handleToggle = jest.fn();

  const { container } = render(
    <LwDataView
      aria-label='Consolidated panel'
      columns={columns}
      rows={rows}
      panel={<div>Panel body</div>}
      panelToggle={{ isExpanded: true, onToggle: handleToggle }}
    />,
  );

  // Expanded state comes from panelToggle.isExpanded — no isPanelExpanded needed.
  expect(container.querySelector('.pf-v6-c-drawer')).toHaveClass('pf-m-expanded');

  // Close button calls panelToggle.onToggle — no onPanelClose needed.
  const closeButton = screen.getByRole('button', { name: 'Close drawer panel' });
  await user.click(closeButton);
  expect(handleToggle).toHaveBeenCalledTimes(1);
});

// ─── Uncontrolled panel-expanded, breakpoint-owned (D15) ──────────────────────
// A page should never need to decide whether the panel starts open — that's
// presentational, and the assembly owns it unless the page explicitly takes
// control via panelToggle.isExpanded / isPanelExpanded.

it('defaults the panel collapsed when uncontrolled and below the inline breakpoint', () => {
  // JSDOM has no matchMedia → useLwBreakpoint returns 'lg', below the default
  // inline threshold ('2xl') → uncontrolled default is collapsed.
  const { container } = render(
    <LwDataView
      aria-label='Uncontrolled panel'
      columns={columns}
      rows={rows}
      panel={<div>Panel body</div>}
      panelToggle={{}}
    />,
  );

  expect(container.querySelector('.pf-v6-c-drawer')).not.toHaveClass('pf-m-expanded');
});

it('toggles the uncontrolled panel open/closed via the built-in toggle button — no page state required', async () => {
  const user = userEvent.setup();

  const { container } = render(
    <LwDataView
      aria-label='Uncontrolled panel'
      columns={columns}
      rows={rows}
      panel={<div>Panel body</div>}
      panelToggle={{}}
    />,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer')!;
  expect(drawer).not.toHaveClass('pf-m-expanded');

  await user.click(screen.getByRole('button', { name: 'Toggle filters' }));
  expect(drawer).toHaveClass('pf-m-expanded');

  await user.click(screen.getByRole('button', { name: 'Toggle filters' }));
  expect(drawer).not.toHaveClass('pf-m-expanded');
});

it('defaults the panel expanded when uncontrolled and responsive is opted out', () => {
  // responsive={false} = static inline drawer; with no breakpoint to gate on,
  // uncontrolled defaults open.
  const { container } = render(
    <LwDataView
      aria-label='Static inline panel'
      columns={columns}
      rows={rows}
      panel={<div>Panel body</div>}
      panelToggle={{}}
      responsive={false}
    />,
  );

  expect(container.querySelector('.pf-v6-c-drawer')).toHaveClass('pf-m-expanded');
});

// ─── isLoading prop (state derivation) ───────────────────────────────────────

it('derives loading state from isLoading=true — shows skeleton, hides toolbar', () => {
  render(
    <LwDataView
      aria-label='Loading table'
      columns={columns}
      rows={[]}
      isLoading
      search={{ value: '', onChange: jest.fn(), placeholder: 'Search' }}
      pagination={paginationProps}
    />,
  );

  // Skeleton rows rendered — sized to paginationProps.perPage (20)
  const bodyRows = document.querySelectorAll('tbody tr');
  expect(bodyRows.length).toBe(paginationProps.perPage);

  // Toolbar hidden during loading
  expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
});

it('derives empty state from isLoading=false + empty rows', () => {
  render(
    <LwDataView
      aria-label='Empty table'
      columns={columns}
      rows={[]}
      isLoading={false}
      emptyState={{ titleText: 'Nothing here' }}
    />,
  );

  expect(screen.getByText('Nothing here')).toBeInTheDocument();
});

it('renders rows normally when isLoading=false and rows are non-empty', () => {
  render(<LwDataView aria-label='Normal table' columns={columns} rows={rows} isLoading={false} />);

  expect(screen.getByText('Row one')).toBeInTheDocument();
  expect(screen.queryByText('No results found')).not.toBeInTheDocument();
});

it('explicit activeState overrides isLoading derivation (backward compat)', () => {
  // Caller passes isLoading but also provides explicit activeState=loading;
  // explicit always wins — used by callers using useTableActiveState hooks.
  render(
    <LwDataView
      aria-label='Explicit state table'
      columns={columns}
      rows={[]}
      activeState={DataViewState.loading}
    />,
  );

  const bodyRows = document.querySelectorAll('tbody tr');
  expect(bodyRows.length).toBe(5);
});

// ─── Default loading skeleton ─────────────────────────────────────────────────

it('caller bodyStates[loading] overrides the default skeleton', () => {
  render(
    <LwDataView
      aria-label='Custom loading table'
      columns={columns}
      rows={[]}
      isLoading
      bodyStates={{
        [DataViewState.loading]: (
          <tbody>
            <tr>
              <td>Custom loading…</td>
            </tr>
          </tbody>
        ),
      }}
    />,
  );

  expect(screen.getByText('Custom loading…')).toBeInTheDocument();
});
