import { useMemo } from 'react';

import { LIGHTWELL_USE_MOCK } from 'Pages/Lightwell/constants';
import { getMockAdvisoriesForLatestRelease } from 'Pages/Lightwell/mockAdvisories';
import type { LightwellAdvisoryResponse } from 'services/Lightwell/AdvisoriesApi';
import { usePackageAdvisoriesQuery } from 'services/Lightwell/AdvisoriesQueries';
import { normalizeAdvisorySeverity, type AdvisorySeverity } from '../utils/severity';

export type AdvisorySeverityCounts = Record<AdvisorySeverity, number>;

export type LatestReleaseFixes = {
  total: number;
  counts: AdvisorySeverityCounts;
};

/**
 * Counts unique advisory_name values (e.g., CVE-2022-42889) by severity and
 * returns results from the API's already package/version-scoped response.
 */
const toLatestReleaseFixes = (advisories: LightwellAdvisoryResponse[]): LatestReleaseFixes => {
  const seen = new Set<string>();
  const counts: AdvisorySeverityCounts = {
    Critical: 0,
    Important: 0,
    Moderate: 0,
    Low: 0,
    None: 0,
  };

  for (const advisory of advisories) {
    if (seen.has(advisory.advisory_name)) continue;
    seen.add(advisory.advisory_name);
    counts[normalizeAdvisorySeverity(advisory.severity_score)] += 1;
  }

  return { total: seen.size, counts };
};

type UseLatestReleaseFixesParams = {
  repository?: string;
  packageName: string;
  packageVersion: string;
  enabled?: boolean;
};

export const useLatestReleaseFixes = ({
  repository,
  packageName,
  packageVersion,
  enabled = true,
}: UseLatestReleaseFixesParams) => {
  const query = usePackageAdvisoriesQuery(
    {
      repository,
      package_name: packageName,
      package_version: packageVersion,
      latest_release: true,
    },
    { enabled: enabled && !LIGHTWELL_USE_MOCK },
  );

  const data = useMemo(
    () => (query.data ? toLatestReleaseFixes(query.data.data) : undefined),
    [query.data],
  );

  if (LIGHTWELL_USE_MOCK) {
    const mockAdvisories = getMockAdvisoriesForLatestRelease({
      package_name: packageName,
      package_version: packageVersion,
    });

    return {
      data: toLatestReleaseFixes(mockAdvisories),
      isLoading: false,
      isFetching: false,
    };
  }

  return { ...query, data };
};
