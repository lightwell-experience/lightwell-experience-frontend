import { ContentItem, ContentListResponse, FilterData } from 'services/Content/ContentApi';

import { getRepositoryPathSlug, getRepositoryDescription } from './helpers';

const mockRepositories = [
  {
    uuid: '11111111-1111-4111-8111-111111111111',
    name: 'lightwell/java/validated',
    published_distribution_url:
      'https://packages.stage.redhat.com/api/pulp-content/lightwell/java/validated/',
    description: getRepositoryDescription('maven', 'validated')!,
    security_level: 'validated',
    content_type: 'maven',
    package_count: 10,
    build_count: 24,
    version_count: 24,
  },
  {
    uuid: '22222222-2222-4222-8222-222222222222',
    name: 'lightwell/java/remediated',
    published_distribution_url:
      'https://packages.stage.redhat.com/api/pulp-content/lightwell/java/remediated/',
    description: getRepositoryDescription('maven', 'remediated')!,
    security_level: 'remediated',
    content_type: 'maven',
    package_count: 11,
    build_count: 28,
    version_count: 28,
  },
  {
    uuid: '33333333-3333-4333-8333-333333333333',
    name: 'lightwell/python/remediated',
    published_distribution_url:
      'https://packages.stage.redhat.com/api/pulp-content/lightwell/python/remediated/',
    description: getRepositoryDescription('python', 'remediated')!,
    security_level: 'remediated',
    content_type: 'python',
    package_count: 13,
    build_count: 31,
    version_count: 31,
  },
  {
    uuid: '44444444-4444-4444-8444-444444444444',
    name: 'lightwell/python/validated',
    published_distribution_url:
      'https://packages.stage.redhat.com/api/pulp-content/lightwell/python/validated/',
    description: getRepositoryDescription('python', 'validated')!,
    security_level: 'validated',
    content_type: 'python',
    package_count: 10,
    build_count: 22,
    version_count: 22,
  },
  {
    uuid: '55555555-5555-4555-8555-555555555555',
    name: 'lightwell/java/predisclosure',
    published_distribution_url:
      'https://packages.stage.redhat.com/api/pulp-content/lightwell/java/predisclosure/',
    description: getRepositoryDescription('maven', 'predisclosure')!,
    security_level: 'predisclosure',
    content_type: 'maven',
    package_count: 8,
    build_count: 18,
    version_count: 18,
  },
  {
    uuid: '66666666-6666-4666-8666-666666666666',
    name: 'lightwell/python/predisclosure',
    published_distribution_url:
      'https://packages.stage.redhat.com/api/pulp-content/lightwell/python/predisclosure/',
    description: getRepositoryDescription('python', 'predisclosure')!,
    security_level: 'predisclosure',
    content_type: 'python',
    package_count: 9,
    build_count: 20,
    version_count: 20,
  },
] as ContentItem[];

export const getMockLightwellRepository = (uuid: string): ContentItem | undefined => {
  const normalizedUuid = decodeURIComponent(uuid);
  return mockRepositories.find((repo) => repo.uuid === normalizedUuid);
};

export const getMockLightwellRepositoryBySlug = (slug: string): ContentItem | undefined =>
  mockRepositories.find(
    (repo) => getRepositoryPathSlug(repo.content_type, repo.security_level) === slug.toLowerCase(),
  );

const demoRepositorySlugs = new Set(['java-validated', 'java-remediated', 'python-validated']);

const demoRepositories = mockRepositories.filter((repo) => {
  const slug = getRepositoryPathSlug(repo.content_type, repo.security_level);
  return demoRepositorySlugs.has(slug);
});

const buildMockRepositoryList = (
  repos: ContentItem[],
  page: number,
  perPage: number,
  filters: FilterData,
): ContentListResponse => {
  const search = (filters.search ?? '').trim().toLowerCase();

  let filtered = repos;

  if (search) {
    filtered = filtered.filter((repo) => repo.name.toLowerCase().includes(search));
  }

  const offset = (page - 1) * perPage;
  const data = filtered.slice(offset, offset + perPage);

  return {
    data,
    links: { first: '', last: '' },
    meta: {
      count: filtered.length,
      limit: perPage,
      offset,
    },
  };
};

export const getMockLightwellRepositoryList = (
  page: number,
  perPage: number,
  filters: FilterData,
): ContentListResponse => buildMockRepositoryList(mockRepositories, page, perPage, filters);

export const getDemoLightwellRepositoryList = (
  page: number,
  perPage: number,
  filters: FilterData,
): ContentListResponse => buildMockRepositoryList(demoRepositories, page, perPage, filters);
