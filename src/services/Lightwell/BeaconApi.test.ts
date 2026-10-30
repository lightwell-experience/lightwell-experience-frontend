import axios from 'axios';

import {
  getBeaconStatus,
  getLtwlsuptTicketIds,
  getVulnerabilities,
  mapLightwellVulnerability,
  type LightwellVulnerabilityCollectionResponse,
  type LightwellVulnerabilityResponse,
} from './BeaconApi';

const baseVulnerability: LightwellVulnerabilityResponse = {
  uuid: '00000000-0000-4000-8000-000000000001',
  vulnerability_id: 'LWL-2026-4401',
  purl: 'pkg:maven/org.apache.logging.log4j/log4j-core@2.17.1',
  component_name: 'log4j-core',
  package: 'log4j-core',
  component_version: '2.17.1',
  published_versions: [],
  title: 'JNDI injection via crafted log message',
  cwe: 'CWE-917',
  description: 'Remote code execution through JNDI lookup in log messages',
  severity: 'Critical',
  cvss: 9.8,
  cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
  exploit_tested: true,
  reproducer_included: true,
  customer_priority: 'Priority 1',
  status: 'Submitted',
  ecosystem: 'java',
  submitted_date: '2026-08-16T00:00:00Z',
  last_updated: '2026-08-17T08:17:00Z',
  age_days: 2,
  duplicate: false,
  ltwlsupt_ticket_ids: ['batch-2', 'batch-3'],
};

describe('mapLightwellVulnerability', () => {
  it('maps API fields to the beacon vulnerability shape', () => {
    const mapped = mapLightwellVulnerability(baseVulnerability);

    expect(mapped).toMatchObject({
      uuid: baseVulnerability.uuid,
      vulnerabilityId: 'LWL-2026-4401',
      componentName: 'log4j-core',
      severity: 'Critical',
      ecosystem: 'java',
      submittedDate: '08-16-2026',
      lastUpdated: '08-17-2026 08:17',
      ltwlsupt_ticket_ids: ['batch-2', 'batch-3'],
      ltwlsupt_ticket_id: 'batch-2',
      publishedVersions: [],
    });
  });

  it('maps a closure reason when the API sends one', () => {
    const mapped = mapLightwellVulnerability({
      ...baseVulnerability,
      status: 'Unremediated',
      resolution_reason: 'The vulnerable component is not present in this package.',
    });

    expect(mapped.status).toBe('Unremediated');
    expect(mapped.resolutionReason).toBe(
      'The vulnerable component is not present in this package.',
    );
  });

  it('omits a blank closure reason', () => {
    const mapped = mapLightwellVulnerability({
      ...baseVulnerability,
      resolution_reason: '   ',
    });

    expect(mapped.resolutionReason).toBeUndefined();
  });

  it('maps Low severity to Minor', () => {
    const mapped = mapLightwellVulnerability({
      ...baseVulnerability,
      severity: 'Low',
    });

    expect(mapped.severity).toBe('Minor');
  });

  it('maps published_versions and defaults a missing array to empty', () => {
    expect(
      mapLightwellVulnerability({
        ...baseVulnerability,
        published_versions: ['1.10.1.rhlw-00002', '1.10.0.rhlw-00001'],
      }).publishedVersions,
    ).toEqual(['1.10.1.rhlw-00002', '1.10.0.rhlw-00001']);

    expect(
      mapLightwellVulnerability({
        ...baseVulnerability,
        published_versions: undefined as unknown as string[],
      }).publishedVersions,
    ).toEqual([]);
  });
});

describe('getBeaconStatus', () => {
  it('returns the last processed time as a 24-hour timestamp', async () => {
    const get = jest.spyOn(axios, 'get').mockResolvedValue({
      data: { last_processed_at: '2026-10-02T08:00:00Z' },
    });

    await expect(getBeaconStatus()).resolves.toBe('10-02-2026 08:00');
    expect(get).toHaveBeenCalledWith('/api/content-sources/v1/lightwell/beacon/status/');

    get.mockRestore();
  });

  it('returns null until the first successful sync', async () => {
    const get = jest.spyOn(axios, 'get').mockResolvedValue({ data: {} });

    await expect(getBeaconStatus()).resolves.toBeNull();

    get.mockRestore();
  });
});

describe('getLtwlsuptTicketIds', () => {
  it('returns support ticket IDs from the API response', async () => {
    const get = jest.spyOn(axios, 'get').mockResolvedValue({
      data: { data: ['batch-1', 'batch-2'] },
    });

    await expect(getLtwlsuptTicketIds('CID-01')).resolves.toEqual(['batch-1', 'batch-2']);
    expect(get).toHaveBeenCalledWith(
      '/api/content-sources/v1/lightwell/beacon/vulnerabilities/ltwlsupt-ticket-ids/?customer_id=CID-01',
    );

    get.mockRestore();
  });
});

describe('getVulnerabilities', () => {
  const collection = (
    data: LightwellVulnerabilityResponse[],
    count: number,
    offset: number,
  ): LightwellVulnerabilityCollectionResponse => ({
    data,
    meta: {
      count,
      limit: 200,
      offset,
      critical_count: 0,
      status_counts: {},
    },
  });

  it('fetches every filtered page when pagination is omitted', async () => {
    const first = { ...baseVulnerability, uuid: 'vuln-1', vulnerability_id: 'LWL-1' };
    const second = { ...baseVulnerability, uuid: 'vuln-2', vulnerability_id: 'LWL-2' };
    const get = jest
      .spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: collection([first], 2, 0) })
      .mockResolvedValueOnce({ data: collection([second], 2, 1) });

    const result = await getVulnerabilities('CID-01', { severities: ['Critical'] });

    expect(get).toHaveBeenNthCalledWith(
      1,
      '/api/content-sources/v1/lightwell/beacon/vulnerabilities/?customer_id=CID-01&limit=200&offset=0&severity=Critical',
    );
    expect(get).toHaveBeenNthCalledWith(
      2,
      '/api/content-sources/v1/lightwell/beacon/vulnerabilities/?customer_id=CID-01&limit=200&offset=1&severity=Critical',
    );
    expect(result.vulnerabilities.map((v) => v.vulnerabilityId)).toEqual(['LWL-1', 'LWL-2']);
    expect(result.meta.count).toBe(2);

    get.mockRestore();
  });

  it('fetches a single page when pagination is provided', async () => {
    const get = jest.spyOn(axios, 'get').mockResolvedValue({
      data: collection([baseVulnerability], 40, 20),
    });

    const result = await getVulnerabilities('CID-01', undefined, { limit: 20, offset: 20 });

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(
      '/api/content-sources/v1/lightwell/beacon/vulnerabilities/?customer_id=CID-01&limit=20&offset=20',
    );
    expect(result.vulnerabilities).toHaveLength(1);

    get.mockRestore();
  });
});
