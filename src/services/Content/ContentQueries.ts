import { keepPreviousData, useQuery, UseQueryOptions } from '@tanstack/react-query';

import {
  ContentListResponse,
  ContentOrigin,
  FilterData,
  getContentList,
  getLightwellRepositoryPackages,
  getMavenPackageVersionsList,
  getPythonPackageVersions,
} from './ContentApi';

export const CONTENT_LIST_KEY = 'CONTENT_LIST_KEY';
export const LIGHTWELL_REPOSITORY_PACKAGES_KEY = 'LIGHTWELL_REPOSITORY_PACKAGES_KEY';
export const MAVEN_PACKAGE_VERSIONS_LIST_KEY = 'MAVEN_PACKAGE_VERSIONS_LIST_KEY';
export const PYTHON_PACKAGE_VERSIONS_KEY = 'PYTHON_PACKAGE_VERSIONS_KEY';

const CONTENT_LIST_POLLING_TIME = 5000;

const buildContentListKey = (
  page: number,
  limit: number,
  sortBy?: string,
  contentOrigin?: ContentOrigin[],
  filterData?: Partial<FilterData>,
) =>
  `${page}${limit}${sortBy}${contentOrigin?.sort().join(',')}${filterData?.arches?.join(
    '',
  )}${filterData?.versions?.join('')}${filterData?.urls?.join('')}${filterData?.uuids?.join(
    '',
  )}${filterData?.statuses?.join('')}${filterData?.availableForArch}${filterData?.availableForVersion}${filterData?.search}${filterData?.name}${filterData?.extended_release}${filterData?.extended_release_version}${filterData?.feature_name}${filterData?.partner}`;

export const useContentListQuery = (
  page: number,
  limit: number,
  filterData: FilterData,
  sortBy: string,
  contentOrigin: ContentOrigin[],
  enabled: boolean = true,
  polling: boolean = false,
  overrides?: Partial<UseQueryOptions<ContentListResponse>>,
) =>
  useQuery({
    queryKey: [
      CONTENT_LIST_KEY,
      buildContentListKey(page, limit, sortBy, contentOrigin, filterData),
    ],
    queryFn: () => getContentList(page, limit, filterData, sortBy, contentOrigin),
    meta: {
      title: 'Unable to get repositories list',
      id: 'content-list-error',
    },
    refetchInterval: polling ? CONTENT_LIST_POLLING_TIME : undefined,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: polling,
    placeholderData: keepPreviousData,
    staleTime: 20000,
    enabled,
    ...overrides,
  });

export const useLightwellRepositoryPackagesQuery = (
  uuid: string,
  page: number,
  limit: number,
  search = '',
  sortBy?: string,
  enabled = true,
) =>
  useQuery({
    queryKey: [LIGHTWELL_REPOSITORY_PACKAGES_KEY, uuid, page, limit, search, sortBy],
    queryFn: () => getLightwellRepositoryPackages(uuid, page, limit, search, sortBy),
    // Keep rows across search, sort, and page changes. Another repository must not show those rows.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === uuid ? previousData : undefined,
    staleTime: 60000,
    enabled: enabled && !!uuid,
    meta: {
      title: 'Unable to find packages for the repository.',
      id: 'lightwell-repository-packages-list-error',
    },
  });

export const useMavenPackageVersionsListQuery = (
  uuid: string,
  group: string,
  name: string,
  enabled = true,
) =>
  useQuery({
    queryKey: [MAVEN_PACKAGE_VERSIONS_LIST_KEY, uuid, group, name],
    queryFn: () => getMavenPackageVersionsList(uuid, group, name),
    staleTime: 60000,
    enabled: enabled && !!uuid && !!group && !!name,
    meta: {
      title: 'Unable to load package versions.',
      id: 'maven-package-versions-list-error',
    },
  });

export const usePythonPackageVersionsQuery = (uuid: string, name: string, enabled = true) =>
  useQuery({
    queryKey: [PYTHON_PACKAGE_VERSIONS_KEY, uuid, name],
    queryFn: () => getPythonPackageVersions(uuid, name),
    staleTime: 60000,
    enabled: enabled && !!uuid && !!name,
    meta: {
      title: 'Unable to load package versions.',
      id: 'python-package-versions-error',
    },
  });
