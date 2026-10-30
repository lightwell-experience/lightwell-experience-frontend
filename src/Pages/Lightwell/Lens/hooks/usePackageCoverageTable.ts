import { useCallback, useMemo, useState } from 'react';
import { useDataViewFilters } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import type { DataViewFilterOption } from '@patternfly/react-data-view/dist/dynamic/DataViewFilters';
import useDebounce from 'Hooks/useDebounce';
import { usePaginationLocalStorage } from 'Hooks/tables/usePaginationLocalStorage';
import { lightwellCoveragePkgsPerPageKey } from 'Pages/Lightwell/constants';
import type { CoverageReportPackageFilters } from 'services/Lightwell/CoverageReportsApi';
import { EcosystemInfo } from '../utils/ecosystem';

export const matchFilterOptions: DataViewFilterOption[] = [
  { label: 'Exact', value: 'exact' },
  { label: 'Partial', value: 'partial' },
  { label: 'None', value: 'none' },
];

const initialFilters: CoverageReportPackageFilters = {
  search: '',
  match_status: [],
  ecosystem: [],
};

export const usePackageCoverageTable = (ecosystems: EcosystemInfo[]) => {
  const { page, perPage, onPerPageSelect, onSetPage, setPage } = usePaginationLocalStorage({
    key: lightwellCoveragePkgsPerPageKey,
  });

  const paginationProps = {
    page,
    perPage,
    onSetPage,
    onPerPageSelect,
  };

  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<CoverageReportPackageFilters>({
      initialFilters,
    });

  const debouncedFilters = useDebounce(
    filters,
    !filters.search && !filters.match_status?.length && !filters.ecosystem?.length ? 0 : 500,
  );

  const isFiltered =
    !!filters.search || !!filters.match_status?.length || !!filters.ecosystem?.length;

  const [filtersActiveAttributeResetKey, setFiltersActiveAttributeResetKey] = useState(0);

  const clearAllFiltersAndResetPage = useCallback(() => {
    clearAllFilters();
    setFiltersActiveAttributeResetKey((current) => current + 1);
    setPage(1);
  }, [clearAllFilters, setPage]);

  const handleFilterChange = useCallback(
    (_key: string, newValues: Partial<CoverageReportPackageFilters>) => {
      onSetFilters(newValues);
      setPage(1);
    },
    [onSetFilters, setPage],
  );

  const ecosystemFilterOptions: DataViewFilterOption[] = useMemo(
    () => ecosystems.map((ecosystem) => ({ label: ecosystem.name, value: ecosystem.name })),
    [ecosystems],
  );

  return {
    filters,
    debouncedFilters,
    isFiltered,
    clearAllFiltersAndResetPage,
    filtersActiveAttributeResetKey,
    handleFilterChange,
    paginationProps,
    ecosystemFilterOptions,
  };
};
