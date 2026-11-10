import { useCallback, useMemo, useState } from 'react';
import { Label, LabelColor } from '@patternfly/react-core';
import { DataViewState } from '@patternfly/react-data-view/dist/dynamic/DataView';
import {
  DataViewFilters,
  type DataViewFilterOption,
} from '@patternfly/react-data-view/dist/dynamic/DataViewFilters';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view/dist/dynamic/DataViewCheckboxFilter';
import { useDataViewFilters } from '@patternfly/react-data-view/dist/dynamic/Hooks';

import {
  LwDataView,
  LwDataViewToolbar,
  type LwDataViewPaginationProps,
  type LwDataViewTh,
  type LwDataViewTr,
} from 'kit/components/assemblies';
import { LwErrorState, LwTooltip } from 'kit/components/primitives';
import type {
  ClearinghouseInvalidReason,
  ClearinghouseSubmissionPackage,
  ClearinghouseSubmissionPackageFilters,
} from 'services/Lightwell/ClearinghouseApi';
import { useSubmissionPackagesQuery } from 'services/Lightwell/ClearinghouseQueries';

const COLUMNS: LwDataViewTh[] = [
  { cell: 'Package', props: { width: 40 } },
  { cell: 'Version', props: { width: 20 } },
  { cell: 'Ecosystem', props: { width: 20 } },
  { cell: 'Status', props: { width: 20 } },
];

const DEFAULT_PER_PAGE = 10;

type Validity = 'valid' | 'invalid';

export const validityFilterOptions: DataViewFilterOption[] = [
  { label: 'Valid', value: 'valid' },
  { label: 'Invalid', value: 'invalid' },
];

type PackageTableFilters = {
  ecosystem: string[];
  validity: string[];
};

const initialFilters: PackageTableFilters = { ecosystem: [], validity: [] };

const INVALID_REASON_LABEL: Record<ClearinghouseInvalidReason, string> = {
  not_a_purl: 'Not a purl',
  missing_version: 'Missing version',
};

/** Translate the table filters into API filters: validity applies only when exactly one is picked. */
export const toApiFilters = ({
  ecosystem,
  validity,
}: PackageTableFilters): ClearinghouseSubmissionPackageFilters => {
  const filters: ClearinghouseSubmissionPackageFilters = {};
  if (ecosystem.length) filters.ecosystem = ecosystem;
  if (validity.length === 1) filters.valid_purl = (validity[0] as Validity) === 'valid';
  return filters;
};

const renderStatusCell = (pkg: ClearinghouseSubmissionPackage) => {
  if (pkg.valid_purl) {
    return (
      <Label isCompact color={LabelColor.green}>
        Valid
      </Label>
    );
  }
  const label = (
    <Label isCompact color={LabelColor.yellow} status='warning'>
      {pkg.invalid_reason ? INVALID_REASON_LABEL[pkg.invalid_reason] : 'Invalid'}
    </Label>
  );
  return pkg.invalid_detail ? <LwTooltip content={pkg.invalid_detail}>{label}</LwTooltip> : label;
};

export type SubmissionPackagesTableProps = {
  uuid: string;
  /** Ecosystems present in the submission, for the ecosystem filter. */
  ecosystems: string[];
};

/**
 * Paginated table of the unique packages in a submission's report, with
 * ecosystem and validity filters. Invalid packageurls show the reason as a label
 * (hover for the backend's detail); ones that don't parse show the raw
 * packageurl as the package name.
 */
const SubmissionPackagesTable = ({ uuid, ecosystems }: SubmissionPackagesTableProps) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<PackageTableFilters>({
    initialFilters,
  });
  const apiFilters = useMemo(() => toApiFilters(filters), [filters]);
  const isFiltered = !!filters.ecosystem.length || !!filters.validity.length;

  const { data, isLoading, isPlaceholderData, isError } = useSubmissionPackagesQuery(
    uuid,
    page,
    perPage,
    apiFilters,
  );
  const packages = data?.data ?? [];
  const count = data?.meta?.count ?? 0;

  const handleFilterChange = useCallback(
    (_key: string, newValues: Partial<PackageTableFilters>) => {
      onSetFilters(newValues);
      setPage(1);
    },
    [onSetFilters],
  );

  const clearAllFiltersAndResetPage = useCallback(() => {
    clearAllFilters();
    setPage(1);
  }, [clearAllFilters]);

  const ecosystemFilterOptions: DataViewFilterOption[] = useMemo(
    () => ecosystems.map((name) => ({ label: name, value: name })),
    [ecosystems],
  );

  const rows: LwDataViewTr[] = packages.map((pkg, index) => ({
    id: `${(page - 1) * perPage + index}-${pkg.packageurl}`,
    row: [
      { cell: pkg.name ? pkg.name : <code>{pkg.packageurl}</code> },
      { cell: pkg.version || '—' },
      { cell: pkg.ecosystem },
      { cell: renderStatusCell(pkg) },
    ],
  }));

  // Server-paginated: controlled so a page change refetches.
  const pagination: LwDataViewPaginationProps = {
    itemCount: count,
    page,
    perPage,
    onSetPage: (_event, newPage) => setPage(newPage),
    onPerPageSelect: (_event, newPerPage, newPage) => {
      setPerPage(newPerPage);
      setPage(newPage);
    },
  };

  return (
    <LwDataView
      aria-label='Submission packages table'
      ouiaId='submission-packages-table'
      containerOuiaId='submission-packages'
      // The drawer tab is already the container chrome; compact density is the
      // kit's opt-in for drawers/modals.
      isCardless
      isCompact
      columns={COLUMNS}
      rows={rows}
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      activeState={isError ? DataViewState.error : undefined}
      bodyStates={{
        [DataViewState.error]: (
          <LwErrorState
            titleText='Unable to load packages'
            bodyText='There was an error retrieving data. Check your connection and try again.'
            customFooter={<></>}
          />
        ),
      }}
      emptyState={{
        hasActiveFilters: isFiltered,
        titleText: 'No packages match the current filters',
        bodyText: 'Reset filters to show more results.',
        onClearFilters: clearAllFiltersAndResetPage,
        noData: { titleText: 'No packages found in this submission' },
      }}
      footer={
        count > 0 ? <LwDataViewToolbar pagination={{ ...pagination, variant: 'bottom' }} /> : null
      }
    >
      {/* Explicit toolbar child (not LwDataView's built-in `pagination`/`toolbarSlot`):
          the built-in toolbar has no `clearAllFilters` passthrough yet, and without it
          PF renders a dead "Clear filters" link next to the filter labels. */}
      <LwDataViewToolbar
        ouiaId='submission-packages-toolbar'
        clearAllFilters={clearAllFiltersAndResetPage}
        filters={
          <DataViewFilters onChange={handleFilterChange} values={filters}>
            <DataViewCheckboxFilter
              filterId='ecosystem'
              ouiaId='submission-packages-filter-ecosystem'
              title='Ecosystem'
              placeholder='Filter by ecosystem'
              options={ecosystemFilterOptions}
            />
            <DataViewCheckboxFilter
              filterId='validity'
              ouiaId='submission-packages-filter-validity'
              title='Status'
              placeholder='Filter by status'
              options={validityFilterOptions}
            />
          </DataViewFilters>
        }
        pagination={{ ...pagination, isCompact: true }}
      />
    </LwDataView>
  );
};

export default SubmissionPackagesTable;
