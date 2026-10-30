import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  ContentItem,
  ContentOrigin,
  PythonPackageDetailResponse,
  PythonPackageVersionsResponse,
  RepositoryPackageItem,
  RepositoryPackagesResponse,
} from 'services/Content/ContentApi';
import type {
  CompletedCoverageReport,
  CoverageReportPackage,
} from 'services/Lightwell/CoverageReportsApi';
import { formatDistributionUrl, formatPythonIndexUrl } from './Pages/Lightwell/helpers';

const queryClient = new QueryClient({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  logger: {
    log: console.log,
    warn: console.warn,
    error: () => null,
  },
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface Props {
  children: React.ReactNode;
}

export const ReactQueryTestWrapper = ({ children }: Props) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

export const defaultLightwellContentItem: ContentItem = {
  account_id: 'undefined',
  distribution_arch: 'any',
  distribution_versions: ['any'],
  name: 'lightwell/java/validated',
  org_id: '-3',
  url: '',
  published_distribution_url: 'https://example.com/lightwell/java/validated',
  uuid: '3875c35b-a67a-4ac2-a989-21139433c177',
  package_count: 1,
  build_count: 3,
  version_count: 3,
  origin: ContentOrigin.LIGHTWELL,
  status: '',
  last_introspection_error: '',
  last_introspection_time: '',
  failed_introspections_count: 0,
  gpg_key: '',
  metadata_verification: false,
  snapshot: false,
  module_hotfixes: false,
  last_introspection_status: '',
  security_level: 'validated',
  content_type: 'maven',
};

export const defaultPythonRemediatedContentItem: ContentItem = {
  ...defaultLightwellContentItem,
  name: 'lightwell/python/remediated',
  published_distribution_url: 'https://example.com/lightwell/python/remediated',
  uuid: '3875c35b-a67a-4a22-a989-21139433c173',
  security_level: 'remediated',
  content_type: 'python',
};

export const defaultPythonValidatedContentItem: ContentItem = {
  ...defaultPythonRemediatedContentItem,
  name: 'lightwell/python/validated',
  published_distribution_url: 'https://example.com/lightwell/python/validated',
  uuid: '3875c35b-a67a-4a22-a989-21139433c174',
  security_level: 'validated',
};

export const defaultPythonPredisclosureContentItem: ContentItem = {
  ...defaultPythonRemediatedContentItem,
  name: 'lightwell/python/predisclosure',
  published_distribution_url: 'https://example.com/lightwell/python/predisclosure',
  uuid: '3875c35b-a67a-4a22-a989-21139433c175',
  security_level: 'predisclosure',
};

export const defaultLightwellRepositoryPackageItem: RepositoryPackageItem = {
  group: 'org.json.test',
  name: 'json-test',
  versions: ['3.14.0'],
  latest_releases: [
    { version: '3.14.0', release: 'rhlw-0004', created_at: '2026-07-01T00:00:00Z' },
  ],
};

export const defaultPythonRemediatedRepositoryPackageItem: RepositoryPackageItem = {
  group: '',
  name: 'requests',
  versions: ['2.31.0', '2.32.0'],
  latest_releases: [
    { version: '2.31.0', release: 'rhlw.1', created_at: '2026-07-01T00:00:00Z' },
    { version: '2.32.0', release: 'rhlw.2', created_at: '2026-06-18T00:00:00Z' },
  ],
};

export const defaultPythonValidatedPackageItem: RepositoryPackageItem = {
  group: '',
  name: 'requests',
  versions: ['2.21.2', '2.20.0'],
  latest_releases: [
    { version: '2.21.2', release: '', created_at: '2026-07-01T00:00:00Z' },
    { version: '2.20.0', release: '', created_at: '2026-06-15T00:00:00Z' },
  ],
};

export const defaultLightwellRepositoryPackageResponse: RepositoryPackagesResponse = {
  results: [defaultLightwellRepositoryPackageItem],
  total: 1,
  limit: 20,
  offset: 0,
};

export const defaultPythonPackageDetail: PythonPackageDetailResponse = {
  name: 'requests',
  version: '2.31.0',
  summary: 'Python HTTP library',
  description: 'Python HTTP library but longer',
  last_updated: '2026-07-01T00:00:00Z',
  license: 'Apache 2.0',
  author: { name: 'Google' },
  upstream_versions: [],
  project_url: 'https://requests.readthedocs.io',
  distributions: [],
};

export const defaultPythonPackageVersions: PythonPackageVersionsResponse = {
  name: 'requests',
  versions: [
    {
      name: 'requests',
      version: '2.31.0',
      summary: 'Python HTTP library',
      description: 'Python HTTP library but longer',
      last_updated: '2026-07-01T00:00:00Z',
      license: 'Apache 2.0',
      author: { name: 'Google' },
      upstream_versions: [],
      project_url: 'https://requests.readthedocs.io',
      distributions: [],
    },
    {
      name: 'requests',
      version: '2.32.0',
      summary: 'Python HTTP library',
      description: 'Python HTTP library but longer',
      last_updated: '2026-07-01T00:00:00Z',
      license: 'Apache 2.0',
      author: { name: 'Google' },
      upstream_versions: [],
      project_url: 'https://requests.readthedocs.io',
      distributions: [],
    },
  ],
};

export const defaultPythonValidatedPackageVersions: PythonPackageVersionsResponse = {
  name: 'requests',
  versions: [
    {
      ...defaultPythonPackageDetail,
      version: '2.21.2',
    },
    {
      ...defaultPythonPackageDetail,
      version: '2.20.0',
      last_updated: '2026-06-15T00:00:00Z',
    },
  ],
};

export const pythonRemediatedPipCommand = `pip install ${defaultPythonRemediatedRepositoryPackageItem.name}==2.32.0+rhlw.2`;
export const otherPythonRemediatedPipCommand = `pip install ${defaultPythonRemediatedRepositoryPackageItem.name}==2.31.0+rhlw.1`;
export const pythonValidatedPipCommand = `pip install ${defaultPythonValidatedPackageItem.name}==2.21.2`;

export const javaRemediatedCopyCommand = `${defaultLightwellRepositoryPackageItem.group}:${defaultLightwellRepositoryPackageItem.name}:3.14.0.rhlw-00001`;
export const otherJavaRemediatedCopyCommand = `${defaultLightwellRepositoryPackageItem.group}:${defaultLightwellRepositoryPackageItem.name}:2.12.0.rhlw-00002`;
export const javaValidatedCopyCommand = `${defaultLightwellRepositoryPackageItem.group}:${defaultLightwellRepositoryPackageItem.name}:2.21.2`;

const javaDistributionUrl = formatDistributionUrl(
  defaultLightwellContentItem.published_distribution_url || '',
);
const pythonRemediatedDistributionUrl = formatDistributionUrl(
  defaultPythonRemediatedContentItem.published_distribution_url || '',
);
const pythonRemediatedIndexUrl = formatPythonIndexUrl(
  defaultPythonRemediatedContentItem.published_distribution_url || '',
);
const pythonValidatedDistributionUrl = formatDistributionUrl(
  defaultPythonValidatedContentItem.published_distribution_url || '',
);
const pythonValidatedIndexUrl = formatPythonIndexUrl(
  defaultPythonValidatedContentItem.published_distribution_url || '',
);

export const mavenRemediatedDependencySnippet = `<!-- Source: ${javaDistributionUrl} -->
<dependency>
  <groupId>${defaultLightwellRepositoryPackageItem.group}</groupId>
  <artifactId>${defaultLightwellRepositoryPackageItem.name}</artifactId>
  <version>3.14.0.rhlw-00001</version>
</dependency>`;

export const gradleRemediatedDependencySnippet = `// Source: ${javaDistributionUrl}
implementation("${defaultLightwellRepositoryPackageItem.group}:${defaultLightwellRepositoryPackageItem.name}:3.14.0.rhlw-00001")`;

export const mavenValidatedDependencySnippet = `<!-- Source: ${javaDistributionUrl} -->
<dependency>
  <groupId>${defaultLightwellRepositoryPackageItem.group}</groupId>
  <artifactId>${defaultLightwellRepositoryPackageItem.name}</artifactId>
  <version>2.21.2</version>
</dependency>`;

export const gradleValidatedDependencySnippet = `// Source: ${javaDistributionUrl}
implementation("${defaultLightwellRepositoryPackageItem.group}:${defaultLightwellRepositoryPackageItem.name}:2.21.2")`;

export const pipRemediatedInstallSnippet = `# Source: ${pythonRemediatedDistributionUrl}
pip install --index-url ${pythonRemediatedIndexUrl} ${defaultPythonRemediatedRepositoryPackageItem.name}==2.32.0+rhlw.2`;

export const requirementsRemediatedInstallSnippet = `# Source: ${pythonRemediatedDistributionUrl}
--index-url ${pythonRemediatedIndexUrl}
${defaultPythonRemediatedRepositoryPackageItem.name}==2.32.0+rhlw.2`;

export const pipConfRemediatedInstallSnippet = `# ~/.config/pip/pip.conf
[global]
index-url = ${pythonRemediatedIndexUrl}`;

export const pipValidatedInstallSnippet = `# Source: ${pythonValidatedDistributionUrl}
pip install --index-url ${pythonValidatedIndexUrl} ${defaultPythonValidatedPackageItem.name}==2.21.2`;

export const requirementsValidatedInstallSnippet = `# Source: ${pythonValidatedDistributionUrl}
--index-url ${pythonValidatedIndexUrl}
${defaultPythonValidatedPackageItem.name}==2.21.2`;

export const pipConfValidatedInstallSnippet = `# ~/.config/pip/pip.conf
[global]
index-url = ${pythonValidatedIndexUrl}`;

export const defaultCoverageReportItem: CompletedCoverageReport = {
  skipped_entries: 0,
  uuid: 'test-uuid',
  created_at: '2026-08-18T12:00:00Z',
  status: 'completed',
  exact_matches: 60,
  partial_matches: 15,
  unmatched: 25,
  total: 100,
  completed_at: '2026-08-18T12:01:00Z',
  cve_summary: { critical: 12, important: 34, moderate: 18, low: 7 },
  ecosystem_coverage_summary: [
    {
      ecosystem: 'Java',
      supported: true,
      exact_matches: 30,
      partial_matches: 10,
      unmatched: 10,
      total: 50,
    },
    {
      ecosystem: 'Python',
      supported: true,
      exact_matches: 20,
      partial_matches: 5,
      unmatched: 10,
      total: 35,
    },
    {
      ecosystem: 'JavaScript',
      supported: false,
      exact_matches: 0,
      partial_matches: 0,
      unmatched: 15,
      total: 15,
    },
  ],
};

export const defaultCoverageReportPackagesItem: CoverageReportPackage[] = [
  {
    name: 'spring-web',
    version: '6.1.5',
    ecosystem: 'Java',
    covered: true,
    match_status: 'exact',
    cve_count: { critical: 2, important: 3, moderate: 1, low: 0 },
    cve_range: { low: 5.4, high: 9.8 },
  },
  {
    name: 'flask',
    version: '3.0.3',
    ecosystem: 'Python',
    covered: true,
    match_status: 'partial',
    cve_count: { critical: 0, important: 0, moderate: 0, low: 0 },
  },
  {
    name: 'lodash',
    version: '4.17.21',
    ecosystem: 'JavaScript',
    covered: false,
    match_status: 'none',
    cve_count: { critical: 0, important: 0, moderate: 0, low: 0 },
  },
];
