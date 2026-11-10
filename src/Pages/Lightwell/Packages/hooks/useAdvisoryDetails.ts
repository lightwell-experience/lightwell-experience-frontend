import { useMemo } from 'react';

import { LIGHTWELL_USE_MOCK } from 'Pages/Lightwell/constants';
import { getMockAdvisoriesForLatestRelease } from 'Pages/Lightwell/mockAdvisories';
import { useAdvisoryDetailsQuery } from 'services/Lightwell/AdvisoriesQueries';
import { toAdvisoryDetails } from '../utils/advisories';
import type { PreferredAdvisoryRecord } from '../types';

type AdvisoryDetailsOptions = {
  enabled?: boolean;
  preferredRecord?: PreferredAdvisoryRecord;
};

export const useAdvisoryDetails = (cveId?: string, options?: AdvisoryDetailsOptions) => {
  const query = useAdvisoryDetailsQuery(cveId, {
    enabled: (options?.enabled ?? Boolean(cveId)) && !LIGHTWELL_USE_MOCK,
  });

  const repository = options?.preferredRecord?.repository;
  const packageName = options?.preferredRecord?.packageName;
  const packageVersion = options?.preferredRecord?.packageVersion;

  const preferredRecord = useMemo(
    () =>
      repository !== undefined && packageName !== undefined && packageVersion !== undefined
        ? { repository, packageName, packageVersion }
        : undefined,
    [repository, packageName, packageVersion],
  );

  const data = useMemo(
    () =>
      cveId && query.data?.data
        ? toAdvisoryDetails(query.data.data, cveId, preferredRecord)
        : undefined,
    [query.data, cveId, preferredRecord],
  );

  if (LIGHTWELL_USE_MOCK) {
    return {
      data: cveId
        ? toAdvisoryDetails(getMockAdvisoriesForLatestRelease(), cveId, preferredRecord)
        : undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      isSuccess: true,
    };
  }

  return { ...query, data };
};
