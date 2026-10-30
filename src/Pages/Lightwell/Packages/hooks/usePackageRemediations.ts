import { useMemo } from 'react';

import { LIGHTWELL_USE_MOCK } from 'Pages/Lightwell/constants';
import { getMockAdvisoriesForLatestRelease } from 'Pages/Lightwell/mockAdvisories';
import { usePackageAdvisoriesQuery } from 'services/Lightwell/AdvisoriesQueries';
import { summarizePackageRemediations, toPackageRemediations } from '../utils/advisories';
import { getPackageCoordinate } from '../utils/format';

type UsePackageRemediationsOptions = {
  enabled?: boolean;
};

type UsePackageRemediationsParams = {
  name: string;
  group?: string;
  isPython: boolean;
  version: string;
  repository: string;
  latestPackageRelease?: string;
};

export const usePackageRemediations = (
  params: UsePackageRemediationsParams,
  { enabled = true }: UsePackageRemediationsOptions = {},
) => {
  const { name, group, isPython, version, repository, latestPackageRelease } = params;
  const packageCoordinate = getPackageCoordinate({ name, group, isPython });

  const query = usePackageAdvisoriesQuery(
    { repository, package_name: packageCoordinate, package_version: version },
    {
      enabled:
        enabled && !LIGHTWELL_USE_MOCK && Boolean(repository && packageCoordinate && version),
    },
  );

  const data = useMemo(
    () => (enabled ? toPackageRemediations(query.data?.data ?? [], latestPackageRelease) : []),
    [enabled, query.data, latestPackageRelease],
  );

  const summary = useMemo(() => summarizePackageRemediations(data), [data]);

  if (LIGHTWELL_USE_MOCK) {
    const mockData = toPackageRemediations(
      getMockAdvisoriesForLatestRelease({
        package_name: packageCoordinate,
        package_version: version,
      }),
      latestPackageRelease,
    );

    return {
      data: mockData,
      summary: summarizePackageRemediations(mockData),
      hasData: true,
      isLoading: false,
      isFetching: false,
      isPlaceholderData: false,
      isError: false,
    };
  }

  return {
    ...query,
    data,
    summary,
    hasData: enabled && query.data !== undefined,
    isLoading: enabled && query.isLoading,
    isFetching: enabled && query.isFetching,
    isPlaceholderData: enabled && query.isPlaceholderData,
    isError: enabled && query.isError,
  };
};
