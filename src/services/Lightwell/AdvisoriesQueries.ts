import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getLightwellAdvisories, type LightwellAdvisoryFilters } from './AdvisoriesApi';

export const LIGHTWELL_ADVISORIES_KEY = 'LIGHTWELL_ADVISORIES_KEY';

// Half the 10-minute advisory sync interval
const ADVISORIES_STALE_TIME_MS = 5 * 60 * 1000;

const advisoryFiltersKey = (filters: LightwellAdvisoryFilters) => ({
  repository: filters.repository ?? '',
  package_name: filters.package_name ?? '',
  package_version: filters.package_version ?? '',
  name: filters.name ?? '',
  severity_min: filters.severity_min ?? '',
  latest_release: filters.latest_release === true,
});

const advisoriesMeta = {
  title: 'Error loading advisories',
  id: 'get-lightwell-advisories-error',
};

export const usePackageAdvisoriesQuery = (
  filters: LightwellAdvisoryFilters,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: [LIGHTWELL_ADVISORIES_KEY, advisoryFiltersKey(filters)],
    queryFn: () => getLightwellAdvisories(filters),
    placeholderData: keepPreviousData,
    staleTime: ADVISORIES_STALE_TIME_MS,
    enabled: options?.enabled ?? true,
    meta: advisoriesMeta,
  });

export const useAdvisoryDetailsQuery = (advisoryName?: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: [LIGHTWELL_ADVISORIES_KEY, advisoryFiltersKey({ name: advisoryName })],
    queryFn: () => getLightwellAdvisories({ name: advisoryName }),
    staleTime: ADVISORIES_STALE_TIME_MS,
    enabled: options?.enabled ?? Boolean(advisoryName),
    meta: advisoriesMeta,
  });
