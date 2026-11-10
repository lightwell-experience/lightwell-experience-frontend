import { useMemo } from 'react';

import { LIGHTWELL_USE_MOCK } from 'Pages/Lightwell/constants';
import { getMockAdvisoriesForLatestRelease } from 'Pages/Lightwell/mockAdvisories';
import type { LightwellAdvisoryResponse } from 'services/Lightwell/AdvisoriesApi';
import { usePackageAdvisoriesQuery } from 'services/Lightwell/AdvisoriesQueries';
import { cveIdsInAliases } from '../utils/advisories';
import { normalizeAdvisorySeverity, type AdvisorySeverity } from '../utils/severity';

export type AdvisorySeverityCounts = Record<AdvisorySeverity, number>;

export type LatestReleaseFixes = {
  total: number;
  counts: AdvisorySeverityCounts;
};

/**
 * Counts unique CVE ids for the newest rebuild of this package version.
 * A row that lists two CVEs counts as two. The same CVE on two rows counts once,
 * keeping the higher severity score. GHSA ids are ignored.
 */
export const toLatestReleaseFixes = (
  advisories: LightwellAdvisoryResponse[],
): LatestReleaseFixes => {
  const bestScoreByCve = new Map<string, number>();

  for (const advisory of advisories) {
    for (const cveId of cveIdsInAliases(advisory.aliases)) {
      const current = bestScoreByCve.get(cveId);
      if (current === undefined || advisory.severity_score > current) {
        bestScoreByCve.set(cveId, advisory.severity_score);
      }
    }
  }

  const counts: AdvisorySeverityCounts = {
    Critical: 0,
    Important: 0,
    Moderate: 0,
    Low: 0,
    None: 0,
  };

  for (const score of bestScoreByCve.values()) {
    counts[normalizeAdvisorySeverity(score)] += 1;
  }

  return { total: bestScoreByCve.size, counts };
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
