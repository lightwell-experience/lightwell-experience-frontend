import type { LightwellAdvisoryResponse } from 'services/Lightwell/AdvisoriesApi';

import {
  copyAdvisoryApiUrl,
  cveIdsInAliases,
  summarizePackageRemediations,
  toAdvisoryDetails,
  toPackageRemediations,
} from './advisories';

const advisory = (
  overrides: Partial<LightwellAdvisoryResponse> &
    Pick<LightwellAdvisoryResponse, 'advisory_id' | 'aliases'>,
): LightwellAdvisoryResponse => {
  const aliases = overrides.aliases;

  return {
    severity: '7.5',
    severity_score: 7.5,
    summary: 'summary',
    details: 'details',
    reference_urls: [],
    package_name: 'org.json:json',
    package_version: '3.14.0',
    fixed_versions: ['3.14.0.rhlw-00001'],
    repository: 'lightwell/java/remediated',
    published: '2026-01-01T00:00:00Z',
    modified: '2026-02-01T00:00:00Z',
    schema_version: '1.6.0',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    ...overrides,
    aliases,
    upstream: overrides.upstream ?? aliases,
  };
};

describe('toPackageRemediations', () => {
  it('emits one row per CVE and release and skips GHSA ids', () => {
    const rows = toPackageRemediations(
      [
        advisory({
          advisory_id: 'RHLW-2026-both',
          aliases: ['CVE-2024-0001', 'GHSA-skip', 'CVE-2024-0002'],
          severity_score: 9.2,
          fixed_versions: ['3.14.0.rhlw-00001', '3.14.0.rhlw-00002'],
        }),
        advisory({
          advisory_id: 'RHLW-2026-dup',
          aliases: ['CVE-2024-0001', 'GHSA-skip'],
          severity_score: 2,
          fixed_versions: ['3.14.0.rhlw-00002'],
        }),
      ],
      '3.14.0.rhlw-00002',
    );

    expect(rows).toEqual([
      {
        advisoryName: 'CVE-2024-0001',
        severity: 'Critical',
        lightwellRelease: '3.14.0.rhlw-00002',
        isLatest: true,
      },
      {
        advisoryName: 'CVE-2024-0002',
        severity: 'Critical',
        lightwellRelease: '3.14.0.rhlw-00002',
        isLatest: true,
      },
      {
        advisoryName: 'CVE-2024-0001',
        severity: 'Critical',
        lightwellRelease: '3.14.0.rhlw-00001',
        isLatest: false,
      },
      {
        advisoryName: 'CVE-2024-0002',
        severity: 'Critical',
        lightwellRelease: '3.14.0.rhlw-00001',
        isLatest: false,
      },
    ]);
    expect(summarizePackageRemediations(rows)).toEqual({ fixes: 2 });
  });

  it('keeps the higher severity when the same CVE and release arrives later', () => {
    const rows = toPackageRemediations([
      advisory({
        advisory_id: 'RHLW-2026-low',
        aliases: ['CVE-2024-0001'],
        severity_score: 2,
        fixed_versions: ['3.14.0.rhlw-00002'],
      }),
      advisory({
        advisory_id: 'RHLW-2026-high',
        aliases: ['CVE-2024-0001'],
        severity_score: 9.2,
        fixed_versions: ['3.14.0.rhlw-00002'],
      }),
    ]);

    expect(rows).toEqual([
      {
        advisoryName: 'CVE-2024-0001',
        severity: 'Critical',
        lightwellRelease: '3.14.0.rhlw-00002',
        isLatest: false,
      },
    ]);
  });

  it('ignores a row whose aliases are missing', () => {
    const rows = toPackageRemediations([
      advisory({
        advisory_id: 'RHLW-2026-missing',
        aliases: undefined as unknown as string[],
        fixed_versions: ['3.14.0.rhlw-00001'],
      }),
      advisory({
        advisory_id: 'RHLW-2026-present',
        aliases: ['CVE-2024-0002'],
        fixed_versions: ['3.14.0.rhlw-00001'],
      }),
    ]);

    expect(rows.map((row) => row.advisoryName)).toEqual(['CVE-2024-0002']);
  });
});

describe('cveIdsInAliases', () => {
  it('returns no CVEs when aliases are missing', () => {
    expect(cveIdsInAliases(undefined)).toEqual([]);
    expect(cveIdsInAliases(null)).toEqual([]);
  });
});

describe('toAdvisoryDetails', () => {
  const pageRecord = advisory({
    advisory_id: 'RHLW-2026-page',
    aliases: ['CVE-2024-0001', 'GHSA-1'],
    severity_score: 4.2,
    summary: 'page summary',
    details: 'page details',
    updated_at: '2026-01-01T00:00:00Z',
    package_name: 'org.json:json',
    package_version: '3.14.0',
    repository: 'lightwell/java/remediated',
    fixed_versions: ['3.14.0.rhlw-00001'],
  });
  const newerOtherPackage = advisory({
    advisory_id: 'RHLW-2026-newer',
    aliases: ['CVE-2024-0001', 'CVE-2024-0002', 'GHSA-1'],
    severity_score: 9.8,
    summary: 'newer summary',
    details: 'newer details',
    updated_at: '2026-08-01T00:00:00Z',
    package_name: 'org.other:lib',
    package_version: '1.2.0',
    repository: 'lightwell/python/remediated',
    fixed_versions: ['1.2.0+rhlw.2'],
  });
  const unrelated = advisory({
    advisory_id: 'RHLW-2026-other',
    aliases: ['CVE-2024-9999', 'GHSA-9'],
    summary: 'unrelated',
    package_name: 'org.other:unrelated',
  });

  it('uses the requested CVE and the advisory for the package version on the page', () => {
    const details = toAdvisoryDetails([newerOtherPackage, pageRecord, unrelated], 'CVE-2024-0001', {
      repository: 'lightwell/java/remediated',
      packageName: 'org.json:json',
      packageVersion: '3.14.0',
    });

    expect(details?.advisoryName).toBe('CVE-2024-0001');
    expect(details?.overview.summary).toBe('page summary');
    expect(details?.overview.details).toBe('page details');
    expect(details?.overview.severity).toBe('Moderate');
    expect(details?.overview.cvssScore).toBe('CVSS 4.2');
    expect(details?.overview).not.toHaveProperty('aliases');
    expect(details?.osv.recordId).toBe('RHLW-2026-page');
    expect(details?.osv.schemaVersion).toBe('1.6.0');
    expect(details?.osv).not.toHaveProperty('source');
    expect(details?.counts).toEqual({ packages: 2, upstreamVersions: 2, ecosystems: 2 });
    expect(details?.remediations.map((ecosystem) => ecosystem.name)).toEqual(['Java', 'Python']);
  });

  it('uses the newest matching advisory when the page package version has no row', () => {
    const details = toAdvisoryDetails([pageRecord, newerOtherPackage], 'CVE-2024-0001');

    expect(details?.overview.summary).toBe('newer summary');
    expect(details?.overview.severity).toBe('Critical');
    expect(details?.osv.recordId).toBe('RHLW-2026-newer');
  });

  it('does not match a GHSA id or a CVE substring', () => {
    expect(toAdvisoryDetails([pageRecord], 'GHSA-1')).toBeUndefined();
    expect(toAdvisoryDetails([pageRecord], 'CVE-2024')).toBeUndefined();
    expect(toAdvisoryDetails([pageRecord], 'CVE-2024-00010')).toBeUndefined();
  });

  it('ignores a row whose aliases are missing', () => {
    expect(
      toAdvisoryDetails(
        [advisory({ advisory_id: 'RHLW-2026-missing', aliases: null as unknown as string[] })],
        'CVE-2024-0001',
      ),
    ).toBeUndefined();
  });
});

describe('copyAdvisoryApiUrl', () => {
  it('copies cve_id and does not copy name', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    await copyAdvisoryApiUrl('CVE-2024-0001');

    const copiedUrl = new URL(writeText.mock.calls[0][0] as string);
    expect(copiedUrl.pathname).toBe('/api/content-sources/v1/lightwell/advisories');
    expect(copiedUrl.searchParams.get('cve_id')).toBe('CVE-2024-0001');
    expect(copiedUrl.searchParams.has('name')).toBe(false);
  });
});
