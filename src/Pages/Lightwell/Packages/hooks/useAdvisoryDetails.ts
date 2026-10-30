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

export const useAdvisoryDetails = (name?: string, options?: AdvisoryDetailsOptions) => {
  const query = useAdvisoryDetailsQuery(name, {
    enabled: (options?.enabled ?? Boolean(name)) && !LIGHTWELL_USE_MOCK,
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
      name && query.data?.data
        ? toAdvisoryDetails(query.data.data, name, preferredRecord)
        : undefined,
    [query.data, name, preferredRecord],
  );

  if (LIGHTWELL_USE_MOCK) {
    return {
      data: name
        ? toAdvisoryDetails(getMockAdvisoriesForLatestRelease(), name, preferredRecord)
        : undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      isSuccess: true,
    };
  }

  return { ...query, data };
};
