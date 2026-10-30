import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigationType, useSearchParams } from 'react-router-dom';

import useDebounce from 'Hooks/useDebounce';

import {
  type LightwellPackagesParams,
  type LightwellPackagesSortBy,
  type LightwellPackagesSortDirection,
  parseSearchParams,
  buildSearchParams,
} from './lightwellPackagesParams';

/**
 * Syncs packages table search, sort, and page state with URL search params
 *
 * Use packagesParams when navigating to package details so table state is preserved
 */
export const useLightwellPackagesParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialParams = parseSearchParams(searchParams);
  const navigationType = useNavigationType();

  // Track the last debounced search so page doesn't reset on initial load from the URL
  const prevDebouncedSearch = useRef<string | undefined>(undefined);
  // The URL already reflected in state. A PUSH/POP that changes it must be applied before
  // state is written back, or the previous sort replaces the incoming one.
  const appliedSearch = useRef(searchParams.toString());
  const applyingUrlNavigation = useRef(false);

  const [searchQuery, setSearchQuery] = useState(initialParams.search);
  const [page, setPage] = useState(initialParams.page);
  const [sortBy, setSortBy] = useState(initialParams.sortBy);
  const [sortDirection, setSortDirection] = useState(initialParams.sortDirection);

  const debouncedSearchQuery = useDebounce(searchQuery, searchQuery === '' ? 0 : 500);
  const debouncedSearch = searchQuery === '' ? '' : debouncedSearchQuery;

  const packagesParams = useMemo<LightwellPackagesParams>(
    () => ({ search: debouncedSearch, page, sortBy, sortDirection }),
    [debouncedSearch, page, sortBy, sortDirection],
  );

  const onSetPage = (_, newPage: number) => setPage(newPage);

  const onSort = (
    nextSortBy: LightwellPackagesSortBy,
    nextDirection: LightwellPackagesSortDirection,
  ) => {
    setSortBy(nextSortBy);
    setSortDirection(nextDirection);
    setPage(1);
  };

  // Reset to first page when the debounced filter changes
  useEffect(() => {
    if (prevDebouncedSearch.current === undefined) {
      prevDebouncedSearch.current = debouncedSearch;
      return;
    }

    if (prevDebouncedSearch.current !== debouncedSearch) {
      prevDebouncedSearch.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  // URL -> state: via back/forward, breadcrumb, or bookmarked link
  useEffect(() => {
    if (navigationType === 'REPLACE') {
      appliedSearch.current = searchParams.toString();
      return;
    }

    if (appliedSearch.current === searchParams.toString()) return;

    applyingUrlNavigation.current = true;
    const parsedParams = parseSearchParams(searchParams);
    setSearchQuery(parsedParams.search);
    setPage(parsedParams.page);
    setSortBy(parsedParams.sortBy);
    setSortDirection(parsedParams.sortDirection);
    prevDebouncedSearch.current = parsedParams.search;
  }, [searchParams, navigationType]);

  // State -> URL: keep the address bar in sync with the current filter, sort, and page.
  // Skip this while a PUSH/POP is still waiting to land in state.
  useEffect(() => {
    const parsedParams = parseSearchParams(searchParams);
    const stateMatchesUrl =
      debouncedSearch === parsedParams.search &&
      page === parsedParams.page &&
      sortBy === parsedParams.sortBy &&
      sortDirection === parsedParams.sortDirection;

    if (applyingUrlNavigation.current) {
      if (!stateMatchesUrl) return;
      applyingUrlNavigation.current = false;
      appliedSearch.current = searchParams.toString();
    }

    const nextParams = buildSearchParams({ search: debouncedSearch, page, sortBy, sortDirection });

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedSearch, page, sortBy, sortDirection, searchParams, setSearchParams]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    page,
    setPage,
    onSetPage,
    sortBy,
    sortDirection,
    onSort,
    packagesParams,
  };
};
