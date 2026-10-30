import {
  fetchData,
  buildBeaconPdfPayload,
  formatBeaconPdfGeneratedAt,
  shouldUseLandscapePdf,
  BEACON_PDF_PAGE_SIZE,
} from './beaconPdf';
import {
  createDefaultVulnerabilityColumns,
  getVisibleVulnerabilityColumns,
} from '../utils/vulnerabilityTableColumns';

const collection = {
  data: [
    {
      uuid: '00000000-0000-4000-8000-000000000001',
      vulnerability_id: 'LWL-2026-4401',
      purl: 'pkg:maven/org.apache.logging.log4j/log4j-core@2.17.1',
      component_name: 'log4j-core',
      package: 'log4j-core',
      component_version: '2.17.1',
      published_versions: ['1.10.0.rhlw-00001'],
      title: 'JNDI injection',
      cwe: 'CWE-917',
      description: 'RCE',
      severity: 'Critical',
      cvss: 9.8,
      exploit_tested: true,
      reproducer_included: true,
      status: 'Submitted',
      ecosystem: 'java',
      submitted_date: '2026-08-16T00:00:00Z',
      last_updated: '2026-08-17T08:17:00Z',
      age_days: 2,
      duplicate: false,
      ltwlsupt_ticket_ids: ['batch-1'],
    },
  ],
  meta: {
    count: 1,
    limit: 50,
    offset: 0,
    critical_count: 1,
    status_counts: { Submitted: 1 },
  },
};

describe('fetchData', () => {
  it('requests the Beacon list with customer, pagination, and filters', async () => {
    const createAsyncRequest = jest.fn().mockResolvedValue(collection);

    const result = await fetchData(createAsyncRequest, {
      customerId: 'CID-01',
      limit: 50,
      offset: 100,
      filters: { severities: ['Critical', 'Minor'] },
    });

    expect(createAsyncRequest).toHaveBeenCalledWith('content-sources-backend', {
      method: 'GET',
      url: '/api/content-sources/v1/lightwell/beacon/vulnerabilities/',
      params: {
        customer_id: 'CID-01',
        limit: '50',
        offset: '100',
        severity: 'Critical,Low',
      },
    });
    expect(result.vulnerabilities[0].vulnerabilityId).toBe('LWL-2026-4401');
    expect(result.vulnerabilities[0].publishedVersions).toEqual(['1.10.0.rhlw-00001']);
    expect(result.meta).toEqual({
      count: 1,
      criticalCount: 1,
      statusCounts: { Submitted: 1 },
    });
  });

  it('requires a customerId', async () => {
    await expect(fetchData(jest.fn())).rejects.toThrow('customerId');
  });
});

describe('buildBeaconPdfPayload', () => {
  const visibleColumns = getVisibleVulnerabilityColumns(createDefaultVulnerabilityColumns());

  it('splits large reports into paginated tasks of 50 rows', () => {
    const payload = buildBeaconPdfPayload({
      customerId: 'CID-01',
      visibleColumns,
      itemCount: 120,
      generatedAt: '25 Aug 2026',
    });

    expect(payload).toHaveLength(Math.ceil(120 / BEACON_PDF_PAGE_SIZE));
    expect(payload[0]).toMatchObject({
      manifestLocation: '/apps/content-sources/fed-mods.json',
      scope: 'contentSources',
      module: './BeaconPdfEntry',
      landscape: false,
      fetchDataParams: { customerId: 'CID-01', limit: 50, offset: 0 },
      additionalData: {
        includeSummary: true,
        generatedAt: '25 Aug 2026',
        customerId: 'CID-01',
        headerBrand: 'lightwell',
        landscape: false,
        isFiltered: false,
      },
    });
    expect(payload[1].fetchDataParams).toMatchObject({ offset: 50 });
    expect(payload[1].additionalData).toMatchObject({ includeSummary: false });
    expect(payload[2].fetchDataParams).toMatchObject({ offset: 100 });
  });

  it('emits a single task when the filtered set is empty', () => {
    const payload = buildBeaconPdfPayload({
      customerId: 'CID-01',
      visibleColumns,
      itemCount: 0,
    });

    expect(payload).toHaveLength(1);
    expect(payload[0].fetchDataParams).toMatchObject({ offset: 0, limit: 50 });
  });

  it('marks the status summary filtered for side-panel filters, not search', () => {
    const filtered = buildBeaconPdfPayload({
      customerId: 'CID-01',
      filters: { statuses: ['Submitted'] },
      visibleColumns,
      itemCount: 1,
      generatedAt: '25 Aug 2026',
      lastUpdated: '2026-10-02 08:00',
    });
    expect(filtered[0].additionalData).toEqual(
      expect.objectContaining({ isFiltered: true, lastUpdated: '2026-10-02 08:00' }),
    );

    const searched = buildBeaconPdfPayload({
      customerId: 'CID-01',
      filters: { search: 'log4j' },
      visibleColumns,
      itemCount: 1,
      generatedAt: '25 Aug 2026',
    });
    expect(searched[0].additionalData).toEqual(expect.objectContaining({ isFiltered: false }));
  });

  it('formats the generated date as a UTC display date', () => {
    expect(formatBeaconPdfGeneratedAt(new Date('2026-08-25T22:58:00Z'))).toBe('25 Aug 2026');

    const payload = buildBeaconPdfPayload({
      customerId: 'CID-01',
      visibleColumns,
      itemCount: 1,
    });

    expect(payload[0].additionalData).toEqual(
      expect.objectContaining({
        generatedAt: formatBeaconPdfGeneratedAt(),
      }),
    );
  });

  it('uses portrait for the default column set and landscape when columns are wide or many', () => {
    expect(shouldUseLandscapePdf(visibleColumns)).toBe(false);
    expect(
      shouldUseLandscapePdf([
        { key: 'vulnerabilityId', title: 'Vulnerability ID' },
        { key: 'status', title: 'Status' },
      ]),
    ).toBe(false);

    const wideColumns = [
      ...visibleColumns,
      { key: 'title', title: 'Title' },
      { key: 'cvssVector', title: 'CVSS Vector' },
    ];
    expect(shouldUseLandscapePdf(wideColumns)).toBe(true);

    const manyColumns = [
      ...visibleColumns,
      { key: 'severity', title: 'Severity' },
      { key: 'cvss', title: 'CVSS' },
      { key: 'repository', title: 'Ecosystem' },
    ];
    expect(manyColumns).toHaveLength(7);
    expect(shouldUseLandscapePdf(manyColumns)).toBe(true);

    const payload = buildBeaconPdfPayload({
      customerId: 'CID-01',
      visibleColumns: wideColumns,
      itemCount: 1,
      generatedAt: '25 Aug 2026',
    });
    expect(payload[0].landscape).toBe(true);
    expect(payload[0].additionalData).toEqual(expect.objectContaining({ landscape: true }));
  });
});
