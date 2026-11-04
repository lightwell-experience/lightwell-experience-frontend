import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import {
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
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
  LwMetricsCard,
  LwMetricsCount,
  LwMetricsCountSlots,
  LwMetricsStepper,
  LwPageHeader,
  PageChromeSlot,
  PageChromeSlotFooter,
  PageChromeSlots,
  PageTitleStack,
  type ColumnManagementModalColumn,
  type LwDataViewManageColumn,
  type LwDataViewTh,
  type LwDataViewTr,
} from 'kit/components/assemblies';
import {
  LwButton,
  LwCheckbox,
  LwEmptyState,
  LwForm,
  LwList,
  LwMenu,
  LwPopover,
  LwTitle,
} from 'kit/components/primitives';

import { lightwellBeaconPerPageKey } from 'Pages/Lightwell/constants';
import {
  FILTER_STATUSES,
  NO_REMEDIATION_LABEL,
  ON_HOLD_STATUS,
  SEVERITIES,
  severityLabel,
  SLA_POLICY_HEADER,
  statusLabel,
  UNREMEDIATED_STATUS,
} from './constants';
import { buildPipelineMetricSteps } from './pipeline';
import { SLA_POLICY_ITEMS } from './slaPolicyItems';
import { buildPackageRows, createDefaultPackageColumns } from './utils/packageTableRows';
import type { Severity, Status, Vulnerability } from './types';
import { useBeaconExport } from './hooks/useBeaconExport';
import { getVulnerabilityTableCellProps } from './components/vulnerabilityTableStickyColumns';
import { renderVulnerabilityCell } from './utils/vulnerabilityTableCells';
import { useBeaconData } from './hooks/useBeaconData';
import {
  type BeaconVulnerabilityFilters,
  type BeaconVulnerabilityFlag,
} from 'services/Lightwell/BeaconApi';
import { useBeaconStatusQuery, useLtwlsuptTicketIdsQuery } from 'services/Lightwell/BeaconQueries';
import { useCustomerIdsQuery } from 'services/Lightwell/CustomerQueries';
import {
  createDefaultVulnerabilityColumns,
  getVisibleVulnerabilityColumns,
  getVulnerabilityColumnValue,
  VULNERABILITY_TABLE_COLUMN_CONFIG,
  type VulnerabilityTableColumn,
} from './utils/vulnerabilityTableColumns';

import '../../../../styles/lightwell-beacon.scss';

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
  const [view, setView] = useState<'vulnerabilities' | 'packages'>('vulnerabilities');
  const isPackageView = view === 'packages';
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
  }, [selectedCustomerId, queryFilters, view]);

  const resetFilters = useCallback(() => {
    setSelectedSeverities(new Set());
    setSelectedStatuses(new Set());
    setSelectedLtwlsuptTickets(new Set());
    setShowDuplicates(false);
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
  const { data: ltwlsuptTicketIds = [] } = useLtwlsuptTicketIdsQuery(selectedCustomerId);
  const { data: lastUpdated } = useBeaconStatusQuery();

  const isLoading = (!displayData && isLoadingDisplay) || (isPackageView && isPlaceholderData);

  if (isError) throw error;

  const filteredVulns = displayData?.vulnerabilities ?? [];
  const displayMeta = displayData?.meta;

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

  const activeFilterCount =
    selectedSeverities.size +
    selectedStatuses.size +
    selectedLtwlsuptTickets.size +
    (showDuplicates ? 1 : 0) +
    (isSearchApplied(searchQuery) ? 1 : 0);

  const itemCount = displayMeta?.count ?? 0;
  // Export has nothing to export at 0 settled rows. Placeholder data keeps the previous count, so
  // Export doesn't flicker while a refetch is in flight; stay visible while the first load runs.
  const showExport = isLoading || itemCount > 0;

  // Grouping is only ever rendered by the package view; the vulnerability view
  // would otherwise rebuild every group on each data change and show none.
  const packageRows = useMemo(
    () => (isPackageView ? buildPackageRows(filteredVulns, packageColumns) : []),
    [isPackageView, filteredVulns, packageColumns],
  );

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
        className: 'beacon-package-table',
        columnKeys: visiblePackageColumns.map((column) => column.key),
        columns: visiblePackageColumns,
        rows: packageRows,
        expandedRows: packageRows.map((row) => ({ rowId: row.id, content: row.expandedContent })),
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
        className: undefined,
        columnKeys: visibleColumns.map((column) => column.key),
        columns: dataViewColumns,
        rows: dataViewRows,
        expandedRows: undefined,
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
            <PageChromeSlotFooter>
              <LwMetricsStepper
                isHorizontal
                aria-label='Submission pipeline metrics'
                isHydrated={isPipelineHydrated}
                steps={pipelineMetricSteps}
              />
            </PageChromeSlotFooter>
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
          ) : selectedCustomerId ? (
            <PageChromeSlot>
              <LwMetricsCard
                hasHeader={`${isPackageView ? 'Vulnerability Status Summary' : 'Status Summary'}${activeFilterCount > 0 ? ' (filtered)' : ''}`}
                hasAction={
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
              >
                <LwLoaded
                  isLoaded={!isLoading}
                  fallback={
                    <LwMetricsCountSlots>
                      <LwMetricsCount isLoading loadingScreenReaderText='Loading status summary' />
                      <LwMetricsCount isLoading />
                      <LwMetricsCount isLoading />
                      <LwMetricsCount isLoading />
                    </LwMetricsCountSlots>
                  }
                >
                  <LwMetricsCountSlots>
                    <LwMetricsCount
                      value={displayMeta?.count ?? filteredVulns.length}
                      label='Total'
                    />
                    <LwMetricsCount
                      value={displayMeta?.criticalCount ?? 0}
                      label='Critical'
                      color='red'
                    />
                    <LwMetricsCount
                      value={displayMeta?.statusCounts?.[ON_HOLD_STATUS] ?? 0}
                      label={ON_HOLD_STATUS}
                      color='none'
                    />
                    <LwMetricsCount
                      value={displayMeta?.statusCounts?.[UNREMEDIATED_STATUS] ?? 0}
                      label={NO_REMEDIATION_LABEL}
                    />
                  </LwMetricsCountSlots>
                </LwLoaded>
              </LwMetricsCard>
            </PageChromeSlot>
          ) : null}
        </PageChromeSlots>
      </LwPageHeader>
      <PageSection data-ouia-component-id='lightwell-beacon-controls'>
        {selectedCustomerId ? (
          <LwButtonGroup>
            <LwButton
              variant={isPackageView ? 'secondary' : 'primary'}
              aria-pressed={!isPackageView}
              onClick={() => setView('vulnerabilities')}
            >
              Vulnerabilities
            </LwButton>
            <LwButton
              variant={isPackageView ? 'primary' : 'secondary'}
              aria-pressed={isPackageView}
              onClick={() => setView('packages')}
            >
              Packages
            </LwButton>
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
            className={tableView.className}
            columns={tableView.columns}
            rows={tableView.rows}
            manageColumns={tableView.manageColumns}
            expandedRows={tableView.expandedRows}
            // Only the vulnerability view has sticky columns. Package expansions
            // need a bounded table rather than the sticky view's max-content sizing.
            isSticky={!isPackageView}
            isCompact={isPackageView || undefined}
            isExpandable={isPackageView}
            indexBy='id'
            // Package rows group the whole filtered result, so LwDataView owns
            // paging and sorts across every package. The vulnerability view is
            // server-paginated — its rows are one page and stay as given.
            isResident={isPackageView}
            isLoading={isLoading}
            isPlaceholderData={isPlaceholderData}
            emptyState={{
              // What the displayed rows were fetched with, not the live UI state: the search is
              // debounced, so right after Reset/clear the UI is already empty while the rows are
              // still the filtered result. Using the UI count would flash "no data" for that tick.
              hasActiveFilters: queryFilters !== undefined,
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
              placeholder: 'Filter by ID, package, or title',
              ariaLabel: 'Filter vulnerabilities by ID, package, or title',
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
    </>
  );
};

export default Beacon;
