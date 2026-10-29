import type { LightwellAdvisoryResponse } from 'services/Lightwell/AdvisoriesApi';

const JAVA_REPOSITORY = 'lightwell/java/remediated';
const PYTHON_REPOSITORY = 'lightwell/python/remediated';

const advisory = (
  overrides: Partial<LightwellAdvisoryResponse> &
    Pick<
      LightwellAdvisoryResponse,
      'advisory_id' | 'advisory_name' | 'package_name' | 'package_version' | 'fixed_versions'
    >,
): LightwellAdvisoryResponse => ({
  severity: '0.0',
  severity_score: 0,
  summary: '',
  details: '',
  reference_urls: [],
  repository: JAVA_REPOSITORY,
  published: '2026-06-01T00:00:00Z',
  modified: '2026-07-01T00:00:00Z',
  aliases: [],
  schema_version: '1.6.0',
  source: 'osv',
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
  ...overrides,
});

// Synthetic CVE shared by Java and Python packages for the drawer's ecosystem grouping.
const SHARED_CVE = 'CVE-2026-1234';
const sharedCveMetadata = {
  severity: '9.8',
  severity_score: 9.8,
  summary: 'Malformed Protocol Buffers input can trigger a parsing failure',
  details:
    'A malformed Protocol Buffers message can cause incorrect bounds handling while untrusted data is decoded. The issue affects multiple Java and Python runtime packages. Lightwell publishes fixed builds for the affected upstream versions. Applications that process externally supplied messages should use the remediated release for their package and version.',
  aliases: ['GHSA-example-1234'],
  schema_version: '1.6.8',
  source: 'pnc-build',
  published: '2026-08-10T00:00:00Z',
  modified: '2026-08-10T00:00:00Z',
  created_at: '2026-08-17T00:00:00Z',
};

type SharedCvePackage = {
  repository: string;
  packageName: string;
  versions: { upstreamVersion: string; fixedVersions: string[] }[];
};

const sharedCvePackages: SharedCvePackage[] = [
  {
    repository: JAVA_REPOSITORY,
    packageName: 'com.google.protobuf:protobuf-java',
    versions: [
      {
        upstreamVersion: '4.25.7',
        fixedVersions: ['4.25.7.rhlw-00001', '4.25.7.rhlw-00002', '4.25.7.rhlw-00003'],
      },
      { upstreamVersion: '4.25.2', fixedVersions: ['4.25.2.rhlw-00002'] },
      { upstreamVersion: '3.25.1', fixedVersions: ['3.25.1.rhlw-00001'] },
    ],
  },
  {
    repository: JAVA_REPOSITORY,
    packageName: 'com.google.protobuf:protobuf-java-util',
    versions: [
      { upstreamVersion: '4.25.7', fixedVersions: ['4.25.7.rhlw-00002'] },
      { upstreamVersion: '4.25.1', fixedVersions: ['4.25.1.rhlw-00001'] },
      { upstreamVersion: '3.25.2', fixedVersions: ['3.25.2.rhlw-00001'] },
    ],
  },
  {
    repository: JAVA_REPOSITORY,
    packageName: 'com.google.protobuf:protobuf-kotlin',
    versions: [
      { upstreamVersion: '4.25.7', fixedVersions: ['4.25.7.rhlw-00002'] },
      { upstreamVersion: '4.25.2', fixedVersions: ['4.25.2.rhlw-00002'] },
      { upstreamVersion: '3.25.3', fixedVersions: ['3.25.3.rhlw-00001'] },
    ],
  },
  {
    repository: JAVA_REPOSITORY,
    packageName: 'com.google.protobuf:protobuf-javalite',
    versions: [
      { upstreamVersion: '4.25.7', fixedVersions: ['4.25.7.rhlw-00002'] },
      { upstreamVersion: '4.25.1', fixedVersions: ['4.25.1.rhlw-00001'] },
      { upstreamVersion: '3.25.1', fixedVersions: ['3.25.1.rhlw-00001'] },
    ],
  },
  {
    repository: PYTHON_REPOSITORY,
    packageName: 'protobuf',
    versions: [
      {
        upstreamVersion: '4.25.7',
        fixedVersions: ['4.25.7+rhlw.1', '4.25.7+rhlw.2', '4.25.7+rhlw.3'],
      },
      { upstreamVersion: '4.25.2', fixedVersions: ['4.25.2+rhlw.2'] },
      { upstreamVersion: '3.25.2', fixedVersions: ['3.25.2+rhlw.1'] },
    ],
  },
  {
    repository: PYTHON_REPOSITORY,
    packageName: 'protobuf-lite',
    versions: [
      { upstreamVersion: '4.25.7', fixedVersions: ['4.25.7+rhlw.2'] },
      { upstreamVersion: '4.25.1', fixedVersions: ['4.25.1+rhlw.1'] },
      { upstreamVersion: '3.25.1', fixedVersions: ['3.25.1+rhlw.1'] },
    ],
  },
];

const sharedCveAdvisories = sharedCvePackages.flatMap(({ repository, packageName, versions }) =>
  versions.map(({ upstreamVersion, fixedVersions }) =>
    advisory({
      ...sharedCveMetadata,
      advisory_id: `x_RHLW-${SHARED_CVE}-${repository === JAVA_REPOSITORY ? 'java' : 'python'}-${packageName.replace(/[^a-zA-Z0-9]+/g, '-')}-${upstreamVersion}`,
      advisory_name: SHARED_CVE,
      repository,
      package_name: packageName,
      package_version: upstreamVersion,
      fixed_versions: fixedVersions,
      updated_at: repository === JAVA_REPOSITORY ? '2026-09-03T00:00:00Z' : '2026-09-05T00:00:00Z',
    }),
  ),
);

type MockAdvisoryPackageFilter = Pick<
  LightwellAdvisoryResponse,
  'package_name' | 'package_version'
>;

const mockAdvisories: LightwellAdvisoryResponse[] = [
  advisory({
    advisory_id: 'x_RHLW-CVE-2022-42889-2.9.0',
    advisory_name: 'CVE-2022-42889',
    severity: '9.8',
    severity_score: 9.800000190734863,
    summary: 'Code injection through string interpolation',
    details:
      'Untrusted input passed to string substitution can be interpolated into a script or lookup that runs code.',
    reference_urls: ['https://nvd.nist.gov/vuln/detail/CVE-2022-42889'],
    aliases: ['GHSA-599f-7c49-w659'],
    package_name: 'com.jayway.jsonpath:json-path',
    package_version: '2.9.0',
    fixed_versions: ['2.9.0.rhlw-00001'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2023-24998-2.9.0',
    advisory_name: 'CVE-2023-24998',
    severity: '5.3',
    severity_score: 5.300000190734863,
    summary: 'Denial of service via multipart requests',
    details:
      'A series of multipart requests can exhaust processing resources and make the service unavailable.',
    reference_urls: ['https://nvd.nist.gov/vuln/detail/CVE-2023-24998'],
    aliases: ['GHSA-h6q6-9hqw-rwfv'],
    package_name: 'com.jayway.jsonpath:json-path',
    package_version: '2.9.0',
    fixed_versions: ['2.9.0.rhlw-00001'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2024-0001-2.8.1',
    advisory_name: 'CVE-2024-0001',
    severity: '3.1',
    severity_score: 3.0999999046325684,
    summary: 'Information leak in an error response',
    details:
      'An error response includes internal details that a caller should not be able to read.',
    reference_urls: ['https://nvd.nist.gov/vuln/detail/CVE-2024-0001'],
    aliases: ['GHSA-lw01-4k2m-9abc'],
    package_name: 'com.jayway.jsonpath:json-path',
    package_version: '2.8.1',
    fixed_versions: ['2.8.1.rhlw-00001'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2024-0002-2.8.1',
    advisory_name: 'CVE-2024-0002',
    severity: '2.4',
    severity_score: 2.4000000953674316,
    summary: 'Verbose debug output leaks a request id',
    details:
      'Debug logging writes an internal request identifier into a response the caller can see.',
    reference_urls: ['https://nvd.nist.gov/vuln/detail/CVE-2024-0002'],
    aliases: ['GHSA-lw02-8n4p-1cde'],
    package_name: 'com.jayway.jsonpath:json-path',
    package_version: '2.8.1',
    fixed_versions: ['2.8.1.rhlw-00001'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2021-44228-2.24.1',
    advisory_name: 'CVE-2021-44228',
    severity: '10.0',
    severity_score: 10.0,
    summary: 'Remote code execution via JNDI lookup',
    details: 'A crafted log message can trigger a JNDI lookup and remote code execution.',
    reference_urls: [
      'https://nvd.nist.gov/vuln/detail/CVE-2021-44228',
      'https://github.com/advisories/GHSA-jfh8-c2jp-5v3q',
    ],
    aliases: ['GHSA-jfh8-c2jp-5v3q'],
    package_name: 'org.apache.logging.log4j:log4j-core',
    package_version: '2.24.1',
    fixed_versions: ['2.24.1.rhlw-00003', '2.24.1.rhlw-00002'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2021-44228-2.24.1-dup',
    advisory_name: 'CVE-2021-44228',
    severity: '10.0',
    severity_score: 10.0,
    summary: 'Remote code execution via JNDI lookup',
    details: 'A crafted log message can trigger a JNDI lookup and remote code execution.',
    reference_urls: [
      'https://nvd.nist.gov/vuln/detail/CVE-2021-44228',
      'https://github.com/advisories/GHSA-jfh8-c2jp-5v3q',
    ],
    aliases: ['GHSA-jfh8-c2jp-5v3q'],
    package_name: 'org.apache.logging.log4j:log4j-core',
    package_version: '2.24.1',
    fixed_versions: ['2.24.1.rhlw-00003'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2024-0001-1.12.1',
    advisory_name: 'CVE-2024-0001',
    severity: '3.1',
    severity_score: 3.0999999046325684,
    summary: 'Information leak in an error response',
    details:
      'An error response includes internal details that a caller should not be able to read.',
    reference_urls: ['https://nvd.nist.gov/vuln/detail/CVE-2024-0001'],
    aliases: ['GHSA-lw01-4k2m-9abc'],
    package_name: 'org.apache.commons:commons-text',
    package_version: '1.12.1',
    fixed_versions: ['1.12.1.rhlw-00001'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2023-24998-6.2.1',
    advisory_name: 'CVE-2023-24998',
    severity: '5.3',
    severity_score: 5.300000190734863,
    summary: 'Denial of service via multipart requests',
    details:
      'A series of multipart requests can exhaust processing resources and make the service unavailable.',
    reference_urls: ['https://nvd.nist.gov/vuln/detail/CVE-2023-24998'],
    aliases: ['GHSA-h6q6-9hqw-rwfv'],
    package_name: 'org.springframework:spring-core',
    package_version: '6.2.1',
    fixed_versions: ['6.2.1.rhlw-00001'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2023-1370-2.5.1',
    advisory_name: 'CVE-2023-1370',
    severity: '7.5',
    severity_score: 7.5,
    summary: 'Stack overflow while parsing deeply nested JSON',
    details: 'A deeply nested JSON document can overflow the parser stack and crash the process.',
    reference_urls: ['https://nvd.nist.gov/vuln/detail/CVE-2023-1370'],
    aliases: ['GHSA-493p-4f3p-h6q5'],
    package_name: 'net.minidev:json-smart',
    package_version: '2.5.1',
    fixed_versions: ['2.5.1.rhlw-00001'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2024-0003-2.5.1',
    advisory_name: 'CVE-2024-0003',
    severity: '7.1',
    severity_score: 7.099999904632568,
    summary: 'Untrusted key lookup in a parsed object',
    details:
      'A parsed object accepts a key that resolves to an unexpected value from another document.',
    reference_urls: ['https://nvd.nist.gov/vuln/detail/CVE-2024-0003'],
    aliases: ['GHSA-js01-2k5m-8abc'],
    package_name: 'net.minidev:json-smart',
    package_version: '2.5.1',
    fixed_versions: ['2.5.1.rhlw-00001'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2021-39139-1.4.21',
    advisory_name: 'CVE-2021-39139',
    severity: '8.8',
    severity_score: 8.800000190734863,
    summary: 'Arbitrary code execution while unmarshalling XML',
    details:
      'Unmarshalling an untrusted XML document can load a type that runs code during construction.',
    reference_urls: ['https://nvd.nist.gov/vuln/detail/CVE-2021-39139'],
    aliases: ['GHSA-hph2-7x8j-2w8q'],
    package_name: 'com.thoughtworks.xstream:xstream',
    package_version: '1.4.21',
    fixed_versions: ['1.4.21.rhlw-00001'],
  }),
  advisory({
    ...sharedCveMetadata,
    advisory_id: 'x_RHLW-CVE-2026-1234-java-protobuf-java-4.25.7-older',
    advisory_name: SHARED_CVE,
    package_name: 'com.google.protobuf:protobuf-java',
    package_version: '4.25.7',
    fixed_versions: ['4.25.7.rhlw-00001'],
    updated_at: '2026-08-20T00:00:00Z',
  }),
  ...sharedCveAdvisories,
  advisory({
    advisory_id: 'x_RHLW-CVE-2026-1235-protobuf-java-4.25.7',
    advisory_name: 'CVE-2026-1235',
    severity: '7.5',
    severity_score: 7.5,
    summary: 'Message size validation can be bypassed',
    details: 'A crafted message can bypass a size limit during parsing.',
    package_name: 'com.google.protobuf:protobuf-java',
    package_version: '4.25.7',
    fixed_versions: ['4.25.7.rhlw-00002', '4.25.7.rhlw-00003'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2026-1236-protobuf-java-4.25.7',
    advisory_name: 'CVE-2026-1236',
    severity: '5.4',
    severity_score: 5.4,
    summary: 'Unexpected input can exhaust parser resources',
    details: 'Repeatedly nested input can consume excessive parsing resources.',
    package_name: 'com.google.protobuf:protobuf-java',
    package_version: '4.25.7',
    fixed_versions: ['4.25.7.rhlw-00003'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2026-1237-protobuf-java-4.25.7',
    advisory_name: 'CVE-2026-1237',
    severity: '2.8',
    severity_score: 2.8,
    summary: 'Parser error output includes internal context',
    details: 'An error response can include internal parsing context.',
    package_name: 'com.google.protobuf:protobuf-java',
    package_version: '4.25.7',
    fixed_versions: ['4.25.7.rhlw-00001', '4.25.7.rhlw-00003'],
  }),
  advisory({
    advisory_id: 'x_RHLW-CVE-2026-1235-protobuf-4.25.7',
    advisory_name: 'CVE-2026-1235',
    severity: '7.5',
    severity_score: 7.5,
    summary: 'Message size validation can be bypassed',
    details: 'A crafted message can bypass a size limit during parsing.',
    repository: PYTHON_REPOSITORY,
    package_name: 'protobuf',
    package_version: '4.25.7',
    fixed_versions: ['4.25.7+rhlw.3'],
  }),
];

/**
 * Returns mock advisory results using the same exact package and version scoping as the API.
 * When no filter is provided, the complete static set is returned for advisory-detail lookups.
 */
export const getMockAdvisoriesForLatestRelease = (
  filters?: MockAdvisoryPackageFilter,
): LightwellAdvisoryResponse[] => {
  if (!filters) {
    return mockAdvisories;
  }

  return mockAdvisories.filter(
    (advisory) =>
      advisory.package_name === filters.package_name &&
      advisory.package_version === filters.package_version,
  );
};
