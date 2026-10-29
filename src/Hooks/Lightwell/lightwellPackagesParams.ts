/**
 * Helpers for Lightwell packages table URL search params (search, sort, and page)
 */
export type LightwellPackagesSortBy = 'name' | 'last_updated';
export type LightwellPackagesSortDirection = 'asc' | 'desc';

export type LightwellPackagesParams = {
  search: string;
  page: number;
  sortBy: LightwellPackagesSortBy;
  sortDirection: LightwellPackagesSortDirection;
};

export const LIGHTWELL_PACKAGES_SEARCH_PARAM = 'search';
export const LIGHTWELL_PACKAGES_SORT_PARAM = 'sort_by';
export const LIGHTWELL_PACKAGES_PAGE_PARAM = 'page';

export const DEFAULT_PACKAGES_PARAMS: LightwellPackagesParams = {
  search: '',
  page: 1,
  sortBy: 'last_updated',
  sortDirection: 'desc',
};

const PACKAGE_SORT_FIELDS: readonly LightwellPackagesSortBy[] = ['name', 'last_updated'];

const isSortField = (value: string): value is LightwellPackagesSortBy =>
  (PACKAGE_SORT_FIELDS as readonly string[]).includes(value);

const parsePageParam = (value: string | null): number => {
  if (!value) return DEFAULT_PACKAGES_PARAMS.page;

  const page = Number.parseInt(value, 10);
  return page >= 1 ? page : DEFAULT_PACKAGES_PARAMS.page;
};

const parseSortParam = (
  value: string | null,
): Pick<LightwellPackagesParams, 'sortBy' | 'sortDirection'> => {
  const [field, direction, extra] = value?.split(':') ?? [];

  if (
    extra === undefined &&
    field &&
    isSortField(field) &&
    (direction === 'asc' || direction === 'desc')
  ) {
    return { sortBy: field, sortDirection: direction };
  }

  return {
    sortBy: DEFAULT_PACKAGES_PARAMS.sortBy,
    sortDirection: DEFAULT_PACKAGES_PARAMS.sortDirection,
  };
};

export const formatLightwellPackagesSortBy = (
  sortBy: LightwellPackagesSortBy,
  sortDirection: LightwellPackagesSortDirection,
): string => `${sortBy}:${sortDirection}`;

const isDefaultSort = (
  sortBy: LightwellPackagesSortBy,
  sortDirection: LightwellPackagesSortDirection,
): boolean =>
  sortBy === DEFAULT_PACKAGES_PARAMS.sortBy &&
  sortDirection === DEFAULT_PACKAGES_PARAMS.sortDirection;

// The packages API sorts by last updated descending when sort_by is omitted.
export const lightwellPackagesSortQuery = (
  sortBy: LightwellPackagesSortBy,
  sortDirection: LightwellPackagesSortDirection,
): string | undefined =>
  isDefaultSort(sortBy, sortDirection)
    ? undefined
    : formatLightwellPackagesSortBy(sortBy, sortDirection);

/**
 * Parses search params from the URL
 *
 * Empty or invalid page values default to 1. Empty search defaults to ''.
 * Missing or invalid sort values default to last updated descending.
 */
export const parseSearchParams = (searchParams: URLSearchParams): LightwellPackagesParams => ({
  search: searchParams.get(LIGHTWELL_PACKAGES_SEARCH_PARAM) ?? DEFAULT_PACKAGES_PARAMS.search,
  page: parsePageParam(searchParams.get(LIGHTWELL_PACKAGES_PAGE_PARAM)),
  ...parseSortParam(searchParams.get(LIGHTWELL_PACKAGES_SORT_PARAM)),
});

// Builds search params from state, omitting default values
export const buildSearchParams = (params: LightwellPackagesParams): URLSearchParams => {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set(LIGHTWELL_PACKAGES_SEARCH_PARAM, params.search);
  }

  if (!isDefaultSort(params.sortBy, params.sortDirection)) {
    searchParams.set(
      LIGHTWELL_PACKAGES_SORT_PARAM,
      formatLightwellPackagesSortBy(params.sortBy, params.sortDirection),
    );
  }

  if (params.page > 1) {
    searchParams.set(LIGHTWELL_PACKAGES_PAGE_PARAM, params.page.toString());
  }

  return searchParams;
};

/**
 * Appends search params to a path
 *
 * Returns the path unchanged when all params are at their defaults
 */
export const appendSearchParams = (path: string, params: LightwellPackagesParams): string => {
  const query = buildSearchParams(params).toString();
  return query ? `${path}?${query}` : path;
};
