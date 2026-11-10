import { capitalize } from 'lodash';
import {
  LIGHTWELL_ADVISORIES_PATH,
  type LightwellAdvisoryResponse,
} from 'services/Lightwell/AdvisoriesApi';

import type {
  AdvisoryDetails,
  AdvisoryFlatRemediation,
  AdvisoryRemediationEcosystem,
  AdvisoryRemediationSeries,
  AdvisoryRemediationVersion,
  PackageAdvisoryRemediation,
  PreferredAdvisoryRecord,
} from '../types';
import { normalizeAdvisorySeverity } from './severity';
import { formatReleaseDate } from './format';
import { getVersionSeries, lightwellReleaseNum, sortVersionsDesc } from './versions';

const CVE_ID_PREFIX = 'CVE-';

const isCveId = (id: string): boolean => id.startsWith(CVE_ID_PREFIX);

/** CVE ids in an advisory alias list. GHSA ids are left out. */
export const cveIdsInAliases = (aliases: readonly string[] | null | undefined): string[] =>
  (aliases ?? []).filter(isCveId);

export const copyAdvisoryApiUrl = async (cveId: string): Promise<void> => {
  const url = new URL(LIGHTWELL_ADVISORIES_PATH, window.location.origin);
  url.searchParams.set('cve_id', cveId);
  await navigator.clipboard.writeText(url.toString());
};

export const buildRemediationCsvRows = (remediations: AdvisoryRemediationEcosystem[]) =>
  remediations.flatMap((ecosystem) =>
    ecosystem.packages.flatMap((pkg) =>
      pkg.series.flatMap((series) =>
        series.versions.map((version) => ({
          Ecosystem: ecosystem.name,
          Package: pkg.name,
          'Upstream version': version.upstreamVersion,
          'Latest Lightwell release': version.lightwellRelease,
        })),
      ),
    ),
  );

export const countAdvisoryUpstreamVersions = (
  series: Pick<AdvisoryRemediationSeries, 'versions'>[],
): number => series.reduce((count, item) => count + item.versions.length, 0);

/** One row per CVE and Lightwell release. A repeated CVE and release keeps the higher score. */
export const toPackageRemediations = (
  advisories: LightwellAdvisoryResponse[],
  latestPackageRelease?: string,
): PackageAdvisoryRemediation[] => {
  const rows = new Map<
    string,
    { remediation: PackageAdvisoryRemediation; severityScore: number }
  >();

  for (const advisory of advisories) {
    for (const cveId of cveIdsInAliases(advisory.aliases)) {
      for (const lightwellRelease of advisory.fixed_versions) {
        const key = `${cveId}\0${lightwellRelease}`;
        const existing = rows.get(key);
        if (!existing || advisory.severity_score > existing.severityScore) {
          rows.set(key, {
            severityScore: advisory.severity_score,
            remediation: {
              advisoryName: cveId,
              severity: normalizeAdvisorySeverity(advisory.severity_score),
              lightwellRelease,
              isLatest: false,
            },
          });
        }
      }
    }
  }

  return [...rows.values()]
    .map(({ remediation }) => ({
      ...remediation,
      isLatest: Boolean(
        latestPackageRelease && remediation.lightwellRelease === latestPackageRelease,
      ),
    }))
    .sort(
      (a, b) =>
        lightwellReleaseNum(b.lightwellRelease) - lightwellReleaseNum(a.lightwellRelease) ||
        a.advisoryName.localeCompare(b.advisoryName),
    );
};

/** Counts unique CVEs for one package version. */
export const summarizePackageRemediations = (
  remediations: Pick<PackageAdvisoryRemediation, 'advisoryName'>[],
) => ({
  fixes: new Set(remediations.map(({ advisoryName }) => advisoryName)).size,
});

const ecosystemFromRepository = (repository: string): string => {
  const withoutPrefix = repository.replace(/^lightwell\//, '');
  const [ecosystem] = withoutPrefix.split('/');
  return ecosystem || repository;
};

/** Use the newest fix recorded for each ecosystem, package, and upstream version. */
const toFlatRemediations = (advisories: LightwellAdvisoryResponse[]): AdvisoryFlatRemediation[] => {
  const rows = new Map<string, AdvisoryFlatRemediation>();

  for (const advisory of advisories) {
    if (!advisory.fixed_versions.length) {
      continue;
    }

    const ecosystem = capitalize(ecosystemFromRepository(advisory.repository));
    const key = `${ecosystem}\0${advisory.package_name}\0${advisory.package_version}`;
    const lightwellRelease = sortVersionsDesc(advisory.fixed_versions)[0];
    const existing = rows.get(key);

    if (
      !existing ||
      sortVersionsDesc([existing.lightwellRelease, lightwellRelease])[0] === lightwellRelease
    ) {
      rows.set(key, {
        ecosystem,
        packageName: advisory.package_name,
        upstreamVersion: advisory.package_version,
        lightwellRelease,
      });
    }
  }

  return [...rows.values()];
};

const groupRemediations = (rows: AdvisoryFlatRemediation[]): AdvisoryRemediationEcosystem[] => {
  const ecosystems = new Map<string, Map<string, Map<string, AdvisoryRemediationVersion[]>>>();

  for (const row of rows) {
    const packages = ecosystems.get(row.ecosystem) ?? new Map();
    const series = packages.get(row.packageName) ?? new Map();
    const seriesName = getVersionSeries(row.upstreamVersion);
    const versions = series.get(seriesName) ?? [];

    versions.push({
      upstreamVersion: row.upstreamVersion,
      lightwellRelease: row.lightwellRelease,
    });
    series.set(seriesName, versions);
    packages.set(row.packageName, series);
    ecosystems.set(row.ecosystem, packages);
  }

  return [...ecosystems.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, packages]) => ({
      name,
      packages: [...packages.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([packageName, series]) => {
          const groupedSeries = [...series.entries()]
            .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
            .map(([seriesName, versions]) => ({
              name: seriesName,
              versions: versions.sort((a, b) =>
                b.upstreamVersion.localeCompare(a.upstreamVersion, undefined, { numeric: true }),
              ),
            }));

          return {
            name: packageName,
            versionCount: countAdvisoryUpstreamVersions(groupedSeries),
            series: groupedSeries,
          };
        }),
    }));
};

const updatedAtTimestamp = (updatedAt: string): number => Date.parse(updatedAt);

const newestAdvisoryFirst = (
  a: LightwellAdvisoryResponse,
  b: LightwellAdvisoryResponse,
): number => {
  const aUpdatedAt = updatedAtTimestamp(a.updated_at);
  const bUpdatedAt = updatedAtTimestamp(b.updated_at);

  if (aUpdatedAt !== bUpdatedAt) {
    return aUpdatedAt > bUpdatedAt ? -1 : 1;
  }

  return a.advisory_id.localeCompare(b.advisory_id);
};

/** Build the drawer model for one CVE. A row matches when aliases contain that CVE. */
export const toAdvisoryDetails = (
  advisories: LightwellAdvisoryResponse[],
  cveId: string,
  preferredRecord?: PreferredAdvisoryRecord,
): AdvisoryDetails | undefined => {
  const matched = isCveId(cveId)
    ? advisories.filter((advisory) => (advisory.aliases ?? []).includes(cveId))
    : [];
  if (!matched.length) {
    return undefined;
  }

  const preferred = preferredRecord
    ? matched.filter(
        (advisory) =>
          advisory.repository === preferredRecord.repository &&
          advisory.package_name === preferredRecord.packageName &&
          advisory.package_version === preferredRecord.packageVersion,
      )
    : [];
  const selected = [...(preferred.length ? preferred : matched)].sort(newestAdvisoryFirst)[0];
  const remediations = groupRemediations(toFlatRemediations(matched));
  const counts: AdvisoryDetails['counts'] = {
    packages: 0,
    upstreamVersions: 0,
    ecosystems: remediations.length,
  };

  for (const ecosystem of remediations) {
    counts.packages += ecosystem.packages.length;
    for (const pkg of ecosystem.packages) {
      counts.upstreamVersions += pkg.versionCount;
    }
  }

  return {
    advisoryName: cveId,
    counts,
    overview: {
      severity: normalizeAdvisorySeverity(selected.severity_score),
      cvssScore: `CVSS ${selected.severity_score.toFixed(1)}`,
      released: formatReleaseDate(selected.published),
      lastUpdated: formatReleaseDate(selected.modified),
      summary: selected.summary,
      details: selected.details,
    },
    remediations,
    osv: {
      schemaVersion: selected.schema_version,
      published: formatReleaseDate(selected.published ?? undefined),
      lastUpdated: formatReleaseDate(selected.modified ?? undefined),
      recordId: selected.advisory_id,
    },
  };
};
