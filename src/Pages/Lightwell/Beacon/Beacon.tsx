import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import {
  Backdrop,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  Flex,
  FormGroup,
  PageSection,
} from '@patternfly/react-core';
import UserIcon from '@patternfly/react-icons/dist/esm/icons/user-icon';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';

import useDebounce from 'Hooks/useDebounce';
import { usePaginationLocalStorage } from 'Hooks/tables/usePaginationLocalStorage';
import { useLightwellRootPath } from '../../../Hooks/Lightwell/navigation/useLightwellRootPath';
import {
  LwButtonGroup,
  LwDataView,
  LwLoaded,
  LwMetricsStepper,
  LwPageHeader,
  PageChromeSlot,
  PageChromeSlots,
  PageTitleStack,
  type ColumnManagementModalColumn,
  type LwDataViewManageColumn,
  type LwDataViewTh,
  type LwDataViewTr,
} from 'kit/components/assemblies';
import { LwMetricsDonutChart } from 'kit/components/assemblies/metrics/donut/metrics-donut-chart';
import {
  LwButton,
  LwCheckbox,
  LwDrawer,
  LwEmptyState,
  LwForm,
  LwLabel,
  LwList,
  LwMenu,
  LwPopover,
  LwSkeleton,
  LwTitle,
  LwToggleGroup,
} from 'kit/components/primitives';

import { useDrawerOverlay } from '../hooks/useDrawerOverlay';
import { lightwellBeaconPerPageKey } from 'Pages/Lightwell/constants';
import {
  FILTER_STATUSES,
  SEVERITIES,
  severityLabel,
  SLA_POLICY_HEADER,
  statusLabel,
} from './constants';
import { buildPipelineMetricSteps } from './pipeline';
import { formatSummarySlice, getBeaconSummaryDonutModel } from './summaryDonutModel';
import { SLA_POLICY_ITEMS } from './slaPolicyItems';
import {
  buildPackageRows,
  createDefaultPackageColumns,
  PACKAGE_COLUMNS,
  PackageDetails,
} from './utils/packageTableRows';
import { getAddressedPackageIds, packageIdentity } from './utils/addressedPackages';
import type { Severity, Status, Vulnerability } from './types';
import { useBeaconExport } from './hooks/useBeaconExport';
import { getVulnerabilityTableCellProps } from './components/vulnerabilityTableStickyColumns';
import { renderVulnerabilityCell, SEVERITY_COLORS } from './utils/vulnerabilityTableCells';
import { useBeaconData } from './hooks/useBeaconData';
import {
  type BeaconVulnerabilityFilters,
  type BeaconVulnerabilityFlag,
} from 'services/Lightwell/BeaconApi';
import {
  useBeaconStatusQuery,
  useBeaconVulnerabilitiesQuery,
  useLtwlsuptTicketIdsQuery,
} from 'services/Lightwell/BeaconQueries';
import { useCustomerIdsQuery } from 'services/Lightwell/CustomerQueries';
import {
  createDefaultVulnerabilityColumns,
  getVisibleVulnerabilityColumns,
  getVulnerabilityColumnValue,
  VULNERABILITY_TABLE_COLUMN_CONFIG,
  type VulnerabilityTableColumn,
} from './utils/vulnerabilityTableColumns';

import '../../../../styles/lightwell-beacon.scss';

// Fixed ring size (px) for the status summary donut. No measuring: the donut slot never
// needs the ring to scale.
const SUMMARY_DONUT_SIZE = 220;

const DROP_LAST_CHROME_SEGMENT_OPTIONS = { dropLastChromeSegment: true };

// The API only receives a search of 2+ non-whitespace characters, so only that counts as an
// applied filter (query builder, "(filtered)" badge, and empty-state classification).
const isSearchApplied = (search: string) => search.trim().length >= 2;

function buildBeaconFilters(
  selectedSeverities: Set<Severity>,
  selectedStatuses: Set<Status>,
  selectedLtwlsuptTickets: Set<string>,
  showDuplicates: boolean,
): BeaconVulnerabilityFilters | undefined {
  const flags: BeaconVulnerabilityFlag[] = [];
  if (showDuplicates) flags.push('duplicate');

  const filters: BeaconVulnerabilityFilters = {
    severities: selectedSeverities.size ? [...selectedSeverities] : undefined,
    statuses: selectedStatuses.size ? [...selectedStatuses] : undefined,
    ltwlsuptTicketIds: selectedLtwlsuptTickets.size ? [...selectedLtwlsuptTickets] : undefined,
    flags: flags.length ? flags : undefined,
  };

  const hasFilters =
    (filters.severities?.length ?? 0) > 0 ||
    (filters.statuses?.length ?? 0) > 0 ||
    (filters.ltwlsuptTicketIds?.length ?? 0) > 0 ||
    (filters.flags?.length ?? 0) > 0;

  return hasFilters ? filters : undefined;
}

/**
 * `lastUpdated`/`submittedDate` arrive pre-formatted as display strings
 * (`MM-DD-YYYY` or `MM-DD-YYYY HH:MM`, see `BeaconApi.ts`'s `formatDate`/
 * `formatDateTime`) — not lexically sortable. Parse back to a timestamp;
 * falls back to `Date.parse` for already-sortable (e.g. ISO, mock) strings.
 */
function parseDisplayDate(value: string): number {
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (match) {
    const [, month, day, year, hour = '0', minute = '0'] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    ).getTime();
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Comparable value for `LwDataViewTd.props.sortValue` (content-based sort, D16) —
 * distinct from `getVulnerabilityColumnValue` (export/display string) because sort
 * needs the *orderable* form, not the *displayed* one. Severity's rank — already
 * centralized in `SEVERITIES` — not its label, so "Critical" sorts above
 * "Important" instead of alphabetically; CVSS as a number, not a string, so "10.0"
 * doesn't sort before "9.8"; dates parsed to a timestamp since their display
 * format isn't lexically sortable. Every other column already has a directly-
 * comparable display string (IDs and text sort lexicographically), so delegates
 * straight through to the existing export-value function.
 */
function getBeaconSortValue(key: string, vulnerability: Vulnerability): string | number {
  switch (key) {
    case 'severity':
      return SEVERITIES.indexOf(vulnerability.severity);
    case 'cvss':
      return vulnerability.cvss;
    case 'lastUpdated':
      return parseDisplayDate(vulnerability.lastUpdated);
    case 'age':
      return parseDisplayDate(vulnerability.submittedDate);
    default:
      return getVulnerabilityColumnValue(key, vulnerability);
  }
}

const Beacon = () => {
  const rootPath = useLightwellRootPath();
  const appBreadcrumbsEnabled = useFlag('platform.chrome.app-breadcrumbs');
  const breadcrumbs = useMemo(
    () => [{ pathname: `${rootPath}/beacon`, title: 'Lightwell Beacon' }],
    [rootPath],
  );

  useRemoteHook({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: appBreadcrumbsEnabled ? [breadcrumbs, DROP_LAST_CHROME_SEGMENT_OPTIONS] : [[]],
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>();
  const [selectedPackageId, setSelectedPackageId] = useState<string>();
  const [view, setView] = useState<'vulnerabilities' | 'packages'>('vulnerabilities');
  const isPackageView = view === 'packages';
  const [allAddressed, setAllAddressed] = useState(false);
  const filterAddressed = isPackageView && allAddressed;
  const [selectedSeverities, setSelectedSeverities] = useState<Set<Severity>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<Status>>(new Set());
  const [selectedLtwlsuptTickets, setSelectedLtwlsuptTickets] = useState<Set<string>>(new Set());
  const [showDuplicates, setShowDuplicates] = useState(false);
  const { page, perPage, onSetPage, onPerPageSelect, setPage } = usePaginationLocalStorage({
    key: lightwellBeaconPerPageKey,
  });
  const paginationProps = { page, perPage, onSetPage, onPerPageSelect };
  const [searchQuery, setSearchQuery] = useState('');
  const [columns, setColumns] = useState(createDefaultVulnerabilityColumns);
  const [packageColumns, setPackageColumns] = useState(createDefaultPackageColumns);

  const debouncedSearch = useDebounce(searchQuery, searchQuery === '' ? 0 : 500);

  const apiFilters = useMemo(
    () =>
      buildBeaconFilters(
        selectedSeverities,
        selectedStatuses,
        selectedLtwlsuptTickets,
        showDuplicates,
      ),
    [selectedSeverities, selectedStatuses, selectedLtwlsuptTickets, showDuplicates],
  );

  const queryFilters = useMemo((): BeaconVulnerabilityFilters | undefined => {
    const search = debouncedSearch.trim();
    const hasSearch = isSearchApplied(search);

    if (!apiFilters && !hasSearch) {
      return undefined;
    }

    return {
      ...apiFilters,
      search: hasSearch ? search : undefined,
    };
  }, [apiFilters, debouncedSearch]);

  const pagination = useMemo(
    () => ({
      limit: perPage,
      offset: (page - 1) * perPage,
    }),
    [page, perPage],
  );

  useEffect(() => {
    setPage(1);
  }, [selectedCustomerId, queryFilters, view, filterAddressed]);

  const resetFilters = useCallback(() => {
    setSelectedSeverities(new Set());
    setSelectedStatuses(new Set());
    setSelectedLtwlsuptTickets(new Set());
    setShowDuplicates(false);
    setAllAddressed(false);
    setSearchQuery('');
    setPage(1);
  }, []);

  // Filters belong to the customer they were applied to; a stale severity/status filter would
  // make an empty new customer look "filtered to zero" instead of truly empty.
  const handleCustomerIdChange = useCallback(
    (customerId: string) => {
      if (customerId === selectedCustomerId) {
        return;
      }

      resetFilters();
      setSelectedPackageId(undefined);
      setSelectedCustomerId(customerId);
    },
    [selectedCustomerId, resetFilters],
  );

  const { data: customerIds, isLoading: isLoadingCustomers } = useCustomerIdsQuery();

  useEffect(() => {
    if (!selectedCustomerId && customerIds?.length === 1) {
      handleCustomerIdChange(customerIds[0]);
    }
  }, [selectedCustomerId, customerIds, handleCustomerIdChange]);

  const customerIdMenuItems = (customerIds ?? []).map((customerId) => ({
    id: customerId,
    children: customerId,
    onSelect: () => handleCustomerIdChange(customerId),
  }));

  // TODO: pass sort params to the API query when backend supports it.
  // Wire `onSortChange` on LwDataView when that work begins.

  const {
    data: displayData,
    isLoading: isLoadingDisplay,
    isPlaceholderData,
    isError,
    error,
  } = useBeaconData(selectedCustomerId, queryFilters, isPackageView ? undefined : pagination);
  // The customer's collection with no display filters applied. Two package-view
  // features need the whole thing: All addressed, and the drawer, which reports a
  // package in full rather than the slice the filters left in the table. Unfiltered
  // its key matches the main package query, so React Query shares one fetch.
  const completeVulnerabilities = useBeaconVulnerabilitiesQuery(
    selectedCustomerId,
    undefined,
    undefined,
    { enabled: Boolean(selectedCustomerId && isPackageView) },
  );
  // Only All addressed makes the table wait on it — the drawer degrades to the
  // filtered grouping instead of blocking the rows behind a second request.
  const eligibilityPending =
    filterAddressed && (!completeVulnerabilities.data || completeVulnerabilities.isPlaceholderData);
  const { data: ltwlsuptTicketIds = [] } = useLtwlsuptTicketIdsQuery(selectedCustomerId);
  const { data: lastUpdated } = useBeaconStatusQuery();

  // Placeholder (stale) rows are passed through to LwDataView as isPlaceholderData,
  // not folded into isLoading — the assembly keeps the toolbar/panel mounted and
  // shows the stale rows during a refetch rather than flashing the skeleton and
  // dropping focus (D28). Same handling for both views.
  const isLoading = !displayData && isLoadingDisplay;

  if (isError) throw error;
  if (filterAddressed && completeVulnerabilities.isError) throw completeVulnerabilities.error;

  const filteredVulns = displayData?.vulnerabilities ?? [];
  const displayMeta = displayData?.meta;
  const summaryTotal = displayMeta?.count ?? filteredVulns.length;
  const summaryDonut = getBeaconSummaryDonutModel(displayMeta?.statusCounts);

  const { isBusy: isExportBusy, items: exportItems } = useBeaconExport({
    customerId: selectedCustomerId,
    filters: queryFilters,
    visibleColumns: getVisibleVulnerabilityColumns(columns),
    itemCount: displayMeta?.count ?? 0,
    lastUpdated: lastUpdated ?? undefined,
  });

  const toggleSeverity = (sev: Severity) => {
    setSelectedSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  };

  const toggleStatus = (status: Status) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const toggleLtwlsuptTicket = (ticketId: string) => {
    setSelectedLtwlsuptTickets((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId);
      else next.add(ticketId);
      return next;
    });
  };

  const vulnerabilityFilterCount =
    selectedSeverities.size +
    selectedStatuses.size +
    selectedLtwlsuptTickets.size +
    (showDuplicates ? 1 : 0) +
    (isSearchApplied(searchQuery) ? 1 : 0);

  const activeFilterCount = vulnerabilityFilterCount + (filterAddressed ? 1 : 0);

  const itemCount = displayMeta?.count ?? 0;
  // Export has nothing to export at 0 settled rows. Placeholder data keeps the previous count, so
  // Export doesn't flicker while a refetch is in flight; stay visible while the first load runs.
  const showExport = isLoading || itemCount > 0;

  // Grouping is only ever rendered by the package view; the vulnerability view
  // would otherwise rebuild every group on each data change and show none.
  const addressedPackageIds = useMemo(
    () => getAddressedPackageIds(completeVulnerabilities.data?.vulnerabilities ?? []),
    [completeVulnerabilities.data],
  );
  const packageRows = useMemo(() => {
    if (!isPackageView || eligibilityPending) return [];
    const vulnerabilities = filterAddressed
      ? filteredVulns.filter((v) => addressedPackageIds.has(packageIdentity(v)))
      : filteredVulns;
    return buildPackageRows(vulnerabilities);
  }, [isPackageView, eligibilityPending, filterAddressed, filteredVulns, addressedPackageIds]);

  // The same grouping over the unfiltered collection — what the drawer reports.
  const completePackageRows = useMemo(
    () =>
      isPackageView && completeVulnerabilities.data
        ? buildPackageRows(completeVulnerabilities.data.vulnerabilities)
        : undefined,
    [isPackageView, completeVulnerabilities.data],
  );

  // Two different questions. The filtered table answers whether the drawer is
  // open at all — a package the filters excluded is no longer there to be looking
  // at. The complete collection answers what the drawer says once it is open, so
  // a package opened under a Published-only filter still lists every one of its
  // CVEs. Until that collection settles (or if it fails outright) the filtered
  // grouping stands in, so the drawer always has something to show.
  const listedPackage = packageRows.find(({ id }) => id === selectedPackageId);
  const selectedPackage = listedPackage
    ? (completePackageRows?.find(({ id }) => id === selectedPackageId) ?? listedPackage)
    : undefined;
  const closePackageDetails = useCallback(() => setSelectedPackageId(undefined), []);
  const packageDrawer = useDrawerOverlay({
    isExpanded: Boolean(selectedPackage),
    onClose: closePackageDetails,
  });

  // A filter, search or All addressed that excludes the open package closes the
  // drawer on its own — `selectedPackage` stops resolving. Drop the id with it,
  // or undoing that filter silently reopens a package the user never reselected.
  useEffect(() => {
    if (selectedPackageId && !selectedPackage) setSelectedPackageId(undefined);
  }, [selectedPackageId, selectedPackage]);

  const packageSeverity = selectedPackage?.severity;

  const visibleColumns = useMemo(
    () =>
      VULNERABILITY_TABLE_COLUMN_CONFIG.filter(
        (column) => columns.find((c) => c.key === column.key)?.isShown ?? false,
      ),
    [columns],
  );

  const dataViewColumns: LwDataViewTh[] = useMemo(
    () =>
      visibleColumns.map((column) => ({
        cell: column.title,
        props: getVulnerabilityTableCellProps(column.key),
      })),
    [visibleColumns],
  );

  const dataViewRows: LwDataViewTr[] = useMemo(
    () =>
      isPackageView
        ? []
        : filteredVulns.map((v) => ({
            id: v.uuid,
            row: visibleColumns.map((column) => ({
              cell: renderVulnerabilityCell(column.key, v),
              props: {
                dataLabel: column.title,
                sortValue: getBeaconSortValue(column.key, v),
                ...getVulnerabilityTableCellProps(column.key),
                ...(column.key === 'component' ? { modifier: 'breakWord' as const } : null),
              },
            })),
          })),
    [isPackageView, filteredVulns, visibleColumns],
  );

  const manageColumnsCatalog: LwDataViewManageColumn[] = useMemo(
    () =>
      columns.map((column) => ({
        key: column.key,
        cell: column.title,
        isShown: column.isShown,
        isShownByDefault: column.isShownByDefault,
        props: getVulnerabilityTableCellProps(column.key),
      })),
    [columns],
  );

  const visiblePackageColumns = useMemo(
    () => packageColumns.filter((column) => column.isShown),
    [packageColumns],
  );

  // The modal hands back key + visibility only, so the rest of each column
  // definition is read back out of state. A key with no definition behind it
  // isn't ours to render — drop it rather than assert it exists.
  const applyPackageColumns = useCallback(
    (applied: ColumnManagementModalColumn[]) =>
      setPackageColumns((current) =>
        applied.flatMap((column) => {
          const definition = current.find((c) => c.key === column.key);
          return definition ? [{ ...definition, isShown: column.isShown ?? false }] : [];
        }),
      ),
    [],
  );

  /**
   * Everything the two views disagree on, resolved once. Keeps the return a
   * single configured table rather than one interleaved by ternary per prop.
   */
  const tableView = isPackageView
    ? {
        ariaLabel: 'Package tracking table',
        columnKeys: visiblePackageColumns.map((column) => column.key),
        columns: visiblePackageColumns,
        // `dataLabel` is the column name PF shows before each cell in the stacked
        // (mobile/narrow) layout — attach the header to every cell so the package
        // view reads correctly there, same as the vulnerability view. The package
        // cell is the drawer's only affordance; LwDataView pins that column as
        // untoggleable, so Manage columns can't hide it away.
        rows: packageRows.map(({ id, summary }) => ({
          id,
          row: visiblePackageColumns.map((column) => ({
            props: { dataLabel: String(column.cell) },
            cell:
              column.key === 'package' ? (
                <LwButton
                  variant='link'
                  isInline
                  aria-label={`${summary.package} ${summary.version} package details`}
                  aria-expanded={selectedPackage?.id === id}
                  aria-controls={
                    packageDrawer.isOverlayMounted ? 'beacon-package-drawer' : undefined
                  }
                  onClick={() => setSelectedPackageId(id)}
                >
                  {summary.package}
                </LwButton>
              ) : (
                summary[column.key]
              ),
          })),
        })),
        // Resident rows carry their own count — LwDataView derives it.
        itemCount: undefined,
        manageColumns: {
          columns: packageColumns,
          onApply: applyPackageColumns,
          onReset: () => setPackageColumns(createDefaultPackageColumns()),
        },
      }
    : {
        ariaLabel: 'Vulnerability tracking table',
        columnKeys: visibleColumns.map((column) => column.key),
        columns: dataViewColumns,
        rows: dataViewRows,
        itemCount: displayMeta?.count ?? 0,
        manageColumns: {
          columns: manageColumnsCatalog,
          onApply: (applied: ColumnManagementModalColumn[]) =>
            setColumns(applied as VulnerabilityTableColumn[]),
          onReset: () => setColumns(createDefaultVulnerabilityColumns()),
        },
      };

  const isPipelineHydrated = Boolean(selectedCustomerId && !isLoading);
  const pipelineMetricSteps = buildPipelineMetricSteps(
    displayMeta?.statusCounts,
    isPipelineHydrated,
  );

  const showCustomerEmpty = !selectedCustomerId && !isLoadingCustomers;
  const slaPolicyBody = <LwList items={SLA_POLICY_ITEMS} />;

  return (
    <>
      <LwPageHeader hero bodyWidth='100%' bodyMaxWidth='100%'>
        <PageChromeSlots>
          <PageChromeSlot>
            <PageTitleStack
              title='Beacon'
              titleAction={
                <LwPopover
                  hasHeader={SLA_POLICY_HEADER}
                  hasBody={slaPolicyBody}
                  hasTrigger={
                    <LwButton isCircle variant='plain' aria-label='SLA help'>
                      <HelpIcon />
                    </LwButton>
                  }
                />
              }
              description={
                <>
                  Track your Lightwell submissions from initial review to fix availability.
                  {lastUpdated ? (
                    <>
                      <br />
                      Last updated: {lastUpdated}
                    </>
                  ) : null}
                </>
              }
              ouiaId='lightwell-beacon-header'
            />
          </PageChromeSlot>
          {showCustomerEmpty ? (
            <PageChromeSlot>
              <LwEmptyState
                headingLevel='h2'
                icon={UserIcon}
                titleText='Which customer would you like to view?'
                variant={EmptyStateVariant.sm}
              >
                <EmptyStateFooter>
                  <EmptyStateActions>
                    <LwMenu
                      label={selectedCustomerId ?? 'Select customer ID'}
                      toggleProps={{
                        ouiaId: 'customer-id-select-toggle',
                        size: 'lg',
                        variant: 'primary',
                      }}
                      isDisabled={customerIdMenuItems.length === 0}
                      items={customerIdMenuItems}
                    />
                  </EmptyStateActions>
                </EmptyStateFooter>
                <EmptyStateBody>
                  Select a customer ID to view their Lightwell submissions.
                </EmptyStateBody>
              </LwEmptyState>
            </PageChromeSlot>
          ) : null}
        </PageChromeSlots>
        {selectedCustomerId ? (
          <PageChromeSlots>
            {/* TODO(LWLP-5615): replace inline slot sizing (flex, alignItems stretch so the
                unhydrated stepper spans its slot) and the donut's end margin with an explicit
                PageChromeSlot prop. The margin adds one extra chrome gap, standing in for the
                stepper's trailing step margin that no longer pads the donut-to-stepper gap. */}
            <PageChromeSlot
              style={{ flex: 'none', marginInlineEnd: 'var(--lw-space--page-chrome-gap)' }}
            >
              <LwLoaded
                isLoaded={!isLoading}
                fallback={
                  <LwSkeleton
                    width={`${SUMMARY_DONUT_SIZE}px`}
                    height={`${SUMMARY_DONUT_SIZE}px`}
                    screenreaderText='Loading status summary'
                  />
                }
              >
                <LwMetricsDonutChart
                  data={summaryDonut.data}
                  colorScale={summaryDonut.colorScale}
                  getLabel={formatSummarySlice}
                  width={SUMMARY_DONUT_SIZE}
                  height={SUMMARY_DONUT_SIZE}
                  title={String(summaryTotal)}
                  subTitle='Total'
                  ariaDesc='Donut chart of vulnerabilities by status'
                  legendAriaLabel='Vulnerability status summary'
                  showLegend
                  legendPosition='responsive'
                />
              </LwLoaded>
            </PageChromeSlot>
            <PageChromeSlot style={{ flex: 1, alignItems: 'stretch', justifyContent: 'center' }}>
              <LwMetricsStepper
                isHorizontal
                aria-label='Submission pipeline metrics'
                isHydrated={isPipelineHydrated}
                steps={pipelineMetricSteps}
              />
            </PageChromeSlot>
          </PageChromeSlots>
        ) : null}
      </LwPageHeader>
      <PageSection data-ouia-component-id='lightwell-beacon-controls'>
        {selectedCustomerId ? (
          <Flex
            justifyContent={{ default: 'justifyContentSpaceBetween' }}
            alignItems={{ default: 'alignItemsFlexEnd' }}
          >
            <LwButtonGroup>
              <LwMenu
                fieldLabel='Customer ID'
                label={selectedCustomerId}
                toggleProps={{ variant: 'primary', ouiaId: 'customer-id-select-toggle' }}
                isDisabled={customerIdMenuItems.length === 0}
                items={customerIdMenuItems}
              />
              {showExport ? (
                <LwMenu
                  label={isPackageView ? 'Export vulnerabilities' : 'Export'}
                  busyLabel='Exporting'
                  isBusy={isExportBusy}
                  toggleProps={{ variant: 'secondary', ouiaId: 'lightwell-beacon-export-toggle' }}
                  popperProps={{ position: 'right' }}
                  items={exportItems}
                />
              ) : null}
            </LwButtonGroup>
            <LwToggleGroup
              aria-label='Table view'
              items={[
                { value: 'vulnerabilities', label: 'Vulnerabilities' },
                { value: 'packages', label: 'Packages' },
              ]}
              value={view}
              onChange={(next) => {
                closePackageDetails();
                setView(next as 'vulnerabilities' | 'packages');
              }}
            />
          </Flex>
        ) : null}
      </PageSection>
      <PageSection
        data-ouia-component-id='lightwell-beacon-page'
        padding={{ default: 'noPadding' }}
      >
        {selectedCustomerId ? (
          <LwDataView
            // LwDataView tracks its active sort by column index internally; remount
            // when the visible-column set/order changes so a stale index can't end
            // up pointing at a different field after a column is hidden/shown.
            key={`${view}:${tableView.columnKeys.join(',')}`}
            aria-label={tableView.ariaLabel}
            columns={tableView.columns}
            rows={tableView.rows}
            manageColumns={tableView.manageColumns}
            indexBy='id'
            // Package rows group the whole filtered result, so LwDataView owns
            // paging and sorts across every package. The vulnerability view is
            // server-paginated — its rows are one page and stay as given.
            isResident={isPackageView}
            isLoading={isLoading || eligibilityPending}
            isPlaceholderData={isPlaceholderData}
            emptyState={{
              // What the displayed rows were fetched with, not the live UI state: the search is
              // debounced, so right after Reset/clear the UI is already empty while the rows are
              // still the filtered result. Using the UI count would flash "no data" for that tick.
              hasActiveFilters: queryFilters !== undefined || filterAddressed,
              titleText: 'No results match the current filters',
              bodyText: 'Reset filters to show more results.',
              onClearFilters: resetFilters,
              noData: {
                titleText: 'No submissions yet',
                bodyText: 'Vulnerabilities will appear here once this customer has submissions.',
              },
            }}
            search={{
              value: searchQuery,
              onChange: setSearchQuery,
              placeholder: 'Filter by ID, key, package, or title',
              ariaLabel: 'Filter vulnerabilities by ID, key, package, or title',
            }}
            pagination={{ ...paginationProps, itemCount: tableView.itemCount }}
            // Uncontrolled — LwDataView owns expanded state, seeded by breakpoint (D15).
            panelToggle={{}}
            panel={
              <>
                <LwForm aria-label='Filter categories' data-ouia-component-id='beacon-filter-panel'>
                  <FormGroup label='Severity'>
                    {SEVERITIES.map((sev) => (
                      <LwCheckbox
                        key={sev}
                        id={`severity-${sev}`}
                        label={severityLabel(sev)}
                        isChecked={selectedSeverities.has(sev)}
                        onChange={() => toggleSeverity(sev)}
                      />
                    ))}
                  </FormGroup>
                  <FormGroup label='Status'>
                    {FILTER_STATUSES.map((status) => (
                      <LwCheckbox
                        key={status}
                        id={`status-${status}`}
                        label={statusLabel(status)}
                        isChecked={selectedStatuses.has(status)}
                        onChange={() => toggleStatus(status)}
                      />
                    ))}
                  </FormGroup>
                  {/* Its own group, unlabelled: it filters whole packages rather
                      than narrowing to a status, so it doesn't belong under the
                      Status heading — but it needs no heading of its own. */}
                  {isPackageView && (
                    <FormGroup>
                      <LwCheckbox
                        id='packages-all-addressed'
                        label='All addressed'
                        isChecked={allAddressed}
                        onChange={() => setAllAddressed((current) => !current)}
                      />
                    </FormGroup>
                  )}
                  {ltwlsuptTicketIds.length > 0 && (
                    <FormGroup label='Support ticket'>
                      {ltwlsuptTicketIds.map((ticketId) => (
                        <LwCheckbox
                          key={ticketId}
                          id={`ticket-${ticketId}`}
                          label={ticketId}
                          isChecked={selectedLtwlsuptTickets.has(ticketId)}
                          onChange={() => toggleLtwlsuptTicket(ticketId)}
                        />
                      ))}
                    </FormGroup>
                  )}
                  <FormGroup label='Flags'>
                    <LwCheckbox
                      id='flag-duplicates'
                      label='Duplicates'
                      isChecked={showDuplicates}
                      onChange={() => setShowDuplicates(!showDuplicates)}
                    />
                  </FormGroup>
                </LwForm>
                {activeFilterCount > 0 && (
                  <LwButton variant='secondary' size='sm' onClick={resetFilters}>
                    Reset
                  </LwButton>
                )}
              </>
            }
            panelHead={
              <>
                <LwTitle headingLevel='h4' size='md'>
                  Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </LwTitle>
              </>
            }
          />
        ) : null}
      </PageSection>
      {packageDrawer.isOverlayMounted &&
        createPortal(
          <Backdrop
            onClick={(event) => {
              if (event.target === event.currentTarget) closePackageDetails();
            }}
          >
            <LwDrawer
              className='beacon-package-drawer'
              position='end'
              isExpanded={packageDrawer.isOverlayExpanded}
              onTransitionEnd={packageDrawer.onOverlayTransitionEnd}
              onPanelClose={closePackageDetails}
              panelCloseAriaLabel='Close package details'
              panelProps={{
                id: 'beacon-package-drawer',
                className: 'beacon-package-drawer-panel',
                isGlass: true,
                defaultSize: 'min(100%, 52rem)',
                minSize: 'min(100%, 28rem)',
                maxSize: '100%',
                resizeAriaLabel: 'Resize package details drawer',
                focusTrap: {
                  enabled: true,
                  elementToFocusOnExpand: '#beacon-package-drawer-title',
                  'aria-labelledby': 'beacon-package-drawer-title',
                },
              }}
              panelHead={
                selectedPackage && (
                  <header className='beacon-package-drawer-header'>
                    <div className='beacon-package-drawer-title'>
                      <LwTitle
                        id='beacon-package-drawer-title'
                        tabIndex={-1}
                        headingLevel='h2'
                        size='lg'
                      >
                        {selectedPackage.summary.package}
                      </LwTitle>
                      {packageSeverity && (
                        <LwLabel
                          variant='outline'
                          isCompact
                          color={SEVERITY_COLORS[packageSeverity]}
                          aria-label={`Highest severity: ${severityLabel(packageSeverity)}`}
                        >
                          {severityLabel(packageSeverity)}
                        </LwLabel>
                      )}
                    </div>
                    <p>
                      Version <strong>{selectedPackage.summary.version}</strong> in{' '}
                      <strong>{selectedPackage.summary.ecosystem}</strong> with{' '}
                      <strong>{selectedPackage.summary.vulnerabilities}</strong>{' '}
                      {selectedPackage.summary.vulnerabilities === 1
                        ? 'vulnerability'
                        : 'vulnerabilities'}
                    </p>
                  </header>
                )
              }
              panelContent={
                selectedPackage && (
                  <>
                    <LwTitle headingLevel='h3' size='lg' className='beacon-package-details-heading'>
                      Details
                    </LwTitle>
                    <DescriptionList
                      isHorizontal
                      isCompact
                      className='beacon-package-drawer-summary'
                    >
                      {PACKAGE_COLUMNS.filter(
                        ({ key }) =>
                          key === 'severityCounts' ||
                          key === 'statuses' ||
                          // A package with no fixed release has nothing to put
                          // here — drop the row rather than print a bare term.
                          (key === 'publishedVersions' && selectedPackage.hasPublishedVersion),
                      ).map(({ key, cell }) => (
                        <DescriptionListGroup key={key}>
                          <DescriptionListTerm>{cell}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {selectedPackage.summary[key]}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      ))}
                    </DescriptionList>
                    <PackageDetails key={selectedPackage.id} group={selectedPackage.group} />
                  </>
                )
              }
            />
          </Backdrop>,
          document.body,
        )}
    </>
  );
};

export default Beacon;
