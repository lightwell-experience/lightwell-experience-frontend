import axios from 'axios';
import { objectToUrlParams } from 'helpers';

export interface ContentItem {
  uuid: string;
  extended_release?: string;
  extended_release_version?: string;
  name: string;
  package_count: number;
  url: string;
  distribution_versions: Array<string>;
  distribution_arch: string;
  account_id: string;
  org_id: string;
  status: string;
  last_introspection_error: string;
  last_introspection_time: string;
  failed_introspections_count: number;
  gpg_key: string;
  metadata_verification: boolean;
  snapshot: boolean;
  module_hotfixes: boolean;
  last_snapshot_uuid?: string;
  label?: string;
  origin?: ContentOrigin;
  last_introspection_status: string;
  content_type?: string;
  description?: string;
  ecosystem?: string;
  security_level?: string;
  published_distribution_url?: string;
  build_count?: number;
  version_count?: number;
  partner?: boolean;
}

export type ContentList = Array<ContentItem>;

export type Links = {
  first: string;
  last: string;
  next?: string;
  prev?: string;
};

export type Meta = {
  count: number;
  limit: number;
  offset: number;
};

export interface ContentListResponse {
  data: ContentList;
  links: Links;
  meta: Meta;
}

export type FilterData = Partial<{
  search: string;
  versions: Array<string>;
  arches: Array<string>;
  extended_release: string;
  extended_release_version: string;
  statuses: Array<string>;
  uuids: Array<string>;
  urls: Array<string>;
  availableForArch: string;
  availableForVersion: string;
  feature_name: string;
  name: string;
  partner: boolean;
}>;

export interface RepositoryPackageReleaseInfo {
  version: string;
  release: string;
  created_at: string;
}

export interface RepositoryPackageItem {
  group: string;
  name: string;
  versions: string[];
  latest_releases: RepositoryPackageReleaseInfo[];
}

export type RepositoryPackagesResponse = {
  results: RepositoryPackageItem[];
  total: number;
  limit: number;
  offset: number;
};

export interface PackageDetailResponse {
  group: string;
  name: string;
  version: string;
  builds: RepositoryPackageReleaseInfo[];
  summary?: string;
  license?: string;
  project_url?: string;
  author?: string;
}

export interface MavenPackageVersionsListResponse {
  group: string;
  name: string;
  versions: PackageDetailResponse[];
}

export interface PythonPackageAuthor {
  name: string;
  email?: string;
}

export interface PythonDistribution {
  name: string;
  filename: string;
  packagetype: string;
  python_version: string;
  sha256: string;
  size: number;
  created_at: string;
}

export interface PythonPackageDetailResponse {
  name: string;
  version: string;
  // Absent or empty while the backend still returns one row per stored version.
  // A non-empty list matches Java: one row per upstream version, releases in `builds`.
  builds?: RepositoryPackageReleaseInfo[];
  summary: string;
  description: string;
  last_updated: string;
  license: string;
  author: PythonPackageAuthor;
  upstream_versions: string[];
  project_url: string;
  distributions: PythonDistribution[];
}

export interface PythonPackageVersionsResponse {
  name: string;
  versions: PythonPackageDetailResponse[];
}

export enum ContentOrigin {
  REDHAT = 'red_hat',
  EXTERNAL = 'external',
  UPLOAD = 'upload',
  COMMUNITY = 'community',
  CUSTOM = 'external,upload',
  ALL = 'red_hat,external,upload,community',
  LIGHTWELL = 'lightwell',
}

export const getContentList: (
  page: number,
  limit: number,
  filterData: FilterData,
  sortBy: string,
  contentOrigin: string[],
) => Promise<ContentListResponse> = async (page, limit, filterData, sortBy, contentOrigin) => {
  const search = filterData.search;
  const versionParam = filterData.versions?.join(',');
  const archParam = filterData.arches?.join(',');
  const statusParam = filterData.statuses?.join(',');
  const urlParam = filterData.urls?.join(',');
  const uuidsParam = filterData.uuids?.join(',');
  // The repositories endpoint accepts 'none' as a filter value to exclude extended release repos.
  // Convert '' to 'none' because objectToUrlParams strips empty strings.
  const extendedReleaseParam =
    filterData.extended_release === '' ? 'none' : filterData.extended_release;
  const { data } = await axios.get(
    `/api/content-sources/v1/repositories/?${objectToUrlParams({
      origin: contentOrigin.length ? contentOrigin.join(',') : undefined,
      offset: ((page - 1) * limit).toString(),
      limit: limit?.toString(),
      search,
      version: versionParam,
      status: statusParam,
      arch: archParam,
      sort_by: sortBy,
      uuid: uuidsParam,
      url: urlParam,
      available_for_arch: filterData.availableForArch,
      available_for_version: filterData.availableForVersion,
      extended_release: extendedReleaseParam,
      extended_release_version: filterData.extended_release_version,
      feature_name: filterData.feature_name,
      name: filterData.name,
      partner: filterData.partner,
    })}`,
  );
  return data;
};

export const getLightwellRepositoryPackages: (
  uuid: string,
  page: number,
  limit: number,
  search?: string,
  sortBy?: string,
) => Promise<RepositoryPackagesResponse> = async (uuid, page, limit, search = '', sortBy) => {
  const { data } = await axios.get(
    `/api/content-sources/v1/repositories/${uuid}/packages?${objectToUrlParams({
      offset: ((page - 1) * limit).toString(),
      limit: limit.toString(),
      search,
      sort_by: sortBy,
    })}`,
  );
  return data;
};

export const getPythonPackageVersions: (
  uuid: string,
  name: string,
) => Promise<PythonPackageVersionsResponse> = async (uuid, name) => {
  const { data } = await axios.get(
    `/api/content-sources/v1/repositories/${uuid}/python_packages/${name}`,
  );
  return data;
};

export const getMavenPackageVersionsList: (
  uuid: string,
  group: string,
  name: string,
) => Promise<MavenPackageVersionsListResponse> = async (uuid, group, name) => {
  const { data } = await axios.get(
    `/api/content-sources/v1/repositories/${uuid}/java_packages/${group}/${name}`,
  );
  return data;
};
