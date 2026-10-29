import type {
  CoverageReportPackage,
  CoverageReportPackageFilters,
  CoverageReportPackagesListResponse,
} from 'services/Lightwell/CoverageReportsApi';

export const MOCK_COVERAGE_PACKAGES_QUERY_KEY = 'lightwell-coverage-packages-mock';

const DUMMY_PACKAGE_SEEDS: Omit<CoverageReportPackage, 'ecosystem' | 'cve_count' | 'cve_range'>[] =
  [
    { name: 'spring-web', version: '6.1.5', covered: true, match_status: 'exact' },
    { name: 'spring-core', version: '6.1.5', covered: true, match_status: 'exact' },
    { name: 'spring-boot-starter-web', version: '3.2.4', covered: true, match_status: 'partial' },
    { name: 'jackson-databind', version: '2.17.0', covered: true, match_status: 'exact' },
    { name: 'netty-codec-http', version: '4.1.108.Final', covered: false, match_status: 'none' },
    { name: 'guava', version: '33.3.0', covered: true, match_status: 'exact' },
    { name: 'commons-lang3', version: '3.14.0', covered: true, match_status: 'partial' },
    { name: 'log4j-core', version: '2.23.1', covered: false, match_status: 'none' },
    { name: 'requests', version: '2.31.0', covered: true, match_status: 'exact' },
    { name: 'urllib3', version: '2.0.7', covered: false, match_status: 'none' },
    { name: 'idna', version: '3.7', covered: true, match_status: 'exact' },
    { name: 'django', version: '4.2.11', covered: true, match_status: 'partial' },
    { name: 'flask', version: '3.0.3', covered: true, match_status: 'exact' },
    { name: 'numpy', version: '1.26.4', covered: true, match_status: 'exact' },
    { name: 'pandas', version: '2.2.2', covered: false, match_status: 'none' },
    { name: 'lodash', version: '4.17.21', covered: true, match_status: 'partial' },
    { name: 'react', version: '18.3.1', covered: true, match_status: 'exact' },
    { name: 'axios', version: '1.7.2', covered: false, match_status: 'none' },
    { name: 'express', version: '4.19.2', covered: true, match_status: 'exact' },
    { name: 'typescript', version: '5.5.4', covered: true, match_status: 'partial' },
    { name: 'webpack', version: '5.93.0', covered: false, match_status: 'none' },
    { name: 'eslint', version: '9.8.0', covered: true, match_status: 'exact' },
    { name: 'prettier', version: '3.3.3', covered: true, match_status: 'exact' },
    { name: 'jest', version: '29.7.0', covered: true, match_status: 'partial' },
    { name: 'moment', version: '2.30.1', covered: false, match_status: 'none' },
    { name: 'uuid', version: '10.0.0', covered: true, match_status: 'exact' },
    { name: 'chalk', version: '5.3.0', covered: true, match_status: 'exact' },
    { name: 'commander', version: '12.1.0', covered: false, match_status: 'none' },
    { name: 'minimist', version: '1.2.8', covered: true, match_status: 'partial' },
    { name: 'debug', version: '4.3.6', covered: true, match_status: 'exact' },
    { name: 'semver', version: '7.6.3', covered: true, match_status: 'exact' },
    { name: 'glob', version: '11.0.0', covered: false, match_status: 'none' },
    { name: 'rimraf', version: '6.0.1', covered: true, match_status: 'partial' },
    { name: 'mkdirp', version: '3.0.1', covered: true, match_status: 'exact' },
    { name: 'yargs', version: '17.7.2', covered: false, match_status: 'none' },
    { name: 'inquirer', version: '10.1.8', covered: true, match_status: 'exact' },
  ];

// Deterministic CVE data so mock mode exercises the net-delta and CVSS columns.
const dummyCveData = (
  index: number,
  matchStatus: CoverageReportPackage['match_status'],
): Pick<CoverageReportPackage, 'cve_count' | 'cve_range'> => {
  // Only fully matched packages are remediated, so unmatched and partially
  // matched packages have no CVE fixes.
  if (matchStatus === 'none' || matchStatus === 'partial') {
    return { cve_count: { critical: 0, important: 0, moderate: 0, low: 0 } };
  }

  return {
    cve_count: {
      critical: index % 3,
      important: (index % 4) + 1,
      moderate: index % 2,
      low: (index + 1) % 2,
    },
    cve_range: { low: 2 + (index % 5), high: 9.8 - (index % 3) },
  };
};

export const getDummyCoveragePackages = (ecosystems: string[]): CoverageReportPackage[] =>
  DUMMY_PACKAGE_SEEDS.map((pkg, index) => ({
    ...pkg,
    ecosystem: ecosystems[index % ecosystems.length],
    ...dummyCveData(index, pkg.match_status),
  }));

export const filterCoveragePackages = (
  packages: CoverageReportPackage[],
  filters: CoverageReportPackageFilters,
): CoverageReportPackage[] =>
  packages.filter(
    (pkg) =>
      (!filters.search || pkg.name.toLowerCase().includes(filters.search.toLowerCase())) &&
      (!filters.match_status?.length || filters.match_status.includes(pkg.match_status)) &&
      (!filters.ecosystem?.length || filters.ecosystem.includes(pkg.ecosystem)),
  );

export const getMockCoveragePackagesList = (
  page: number,
  perPage: number,
  filters: CoverageReportPackageFilters,
  ecosystems: string[],
): CoverageReportPackagesListResponse => {
  const filtered = filterCoveragePackages(getDummyCoveragePackages(ecosystems), filters);
  const offset = (page - 1) * perPage;

  return {
    data: filtered.slice(offset, offset + perPage),
    links: { first: '', last: '' },
    meta: {
      count: filtered.length,
      limit: perPage,
      offset,
    },
  };
};
