import { EXPORT_PAGE_SIZE } from '../../utils/exportUtils';
import {
  buildCoveragePackagesQueryParams,
  buildCoveragePdfPayload,
  fetchData,
  formatCoveragePdfGeneratedAt,
} from './coveragePdf';
import { defaultCoverageReportItem } from 'testingHelpers';

const packagesCollection = {
  data: [
    {
      name: 'spring-web',
      version: '6.1.5',
      ecosystem: 'Java',
      covered: true,
      match_status: 'exact',
    },
  ],
  links: { first: '', last: '' },
  meta: { count: 1, limit: 50, offset: 0 },
};

describe('buildCoveragePackagesQueryParams', () => {
  it('serializes pagination and active filters', () => {
    expect(
      buildCoveragePackagesQueryParams(
        { search: 'log4j', match_status: ['exact', 'partial'], ecosystem: ['Java'] },
        { limit: 50, offset: 100 },
      ),
    ).toEqual({
      limit: '50',
      offset: '100',
      search: 'log4j',
      match_status: 'exact,partial',
      ecosystem: 'Java',
    });
  });

  it('omits empty filters', () => {
    expect(buildCoveragePackagesQueryParams(undefined, { limit: 50, offset: 0 })).toEqual({
      limit: '50',
      offset: '0',
    });
  });
});

describe('fetchData', () => {
  it('requests packages with pagination and filters, and the report only for the summary page', async () => {
    const createAsyncRequest = jest
      .fn()
      .mockResolvedValueOnce(packagesCollection)
      .mockResolvedValueOnce(defaultCoverageReportItem);

    const result = await fetchData(createAsyncRequest, {
      uuid: 'report-uuid',
      offset: 50,
      filters: { match_status: ['exact'] },
      includeSummary: true,
    });

    expect(createAsyncRequest).toHaveBeenNthCalledWith(1, 'content-sources-backend', {
      method: 'GET',
      url: '/api/content-sources/v1/coverage_reports/report-uuid/packages',
      params: { limit: String(EXPORT_PAGE_SIZE), offset: '50', match_status: 'exact' },
    });
    expect(createAsyncRequest).toHaveBeenNthCalledWith(2, 'content-sources-backend', {
      method: 'GET',
      url: '/api/content-sources/v1/coverage_reports/report-uuid',
    });
    expect(result.packages[0].name).toBe('spring-web');
    expect(result.meta.count).toBe(1);
    expect(result.report).toEqual(defaultCoverageReportItem);
  });

  it('skips the report request on continuation pages', async () => {
    const createAsyncRequest = jest.fn().mockResolvedValue(packagesCollection);

    const result = await fetchData(createAsyncRequest, {
      uuid: 'report-uuid',
      offset: 50,
      includeSummary: false,
    });

    expect(createAsyncRequest).toHaveBeenCalledTimes(1);
    expect(result.report).toBeNull();
  });

  it('loads only the report when the package table is omitted', async () => {
    const createAsyncRequest = jest.fn().mockResolvedValue(defaultCoverageReportItem);

    const result = await fetchData(createAsyncRequest, {
      uuid: 'report-uuid',
      includeSummary: true,
      includePackages: false,
    });

    expect(createAsyncRequest).toHaveBeenCalledTimes(1);
    expect(createAsyncRequest).toHaveBeenCalledWith('content-sources-backend', {
      method: 'GET',
      url: '/api/content-sources/v1/coverage_reports/report-uuid',
    });
    expect(result.packages).toEqual([]);
    expect(result.report).toEqual(defaultCoverageReportItem);
  });

  it('requires a uuid', async () => {
    await expect(fetchData(jest.fn())).rejects.toThrow('uuid');
  });

  it('follows package pages until the report is complete', async () => {
    const packageRow = (name: string) => ({
      name,
      version: '1',
      ecosystem: 'npm',
      covered: false,
      match_status: 'none' as const,
    });
    const fullPage = {
      data: Array.from({ length: EXPORT_PAGE_SIZE }, (_, index) => packageRow(`pkg-${index}`)),
      links: { first: '', last: '' },
      meta: { count: EXPORT_PAGE_SIZE + 1, limit: EXPORT_PAGE_SIZE, offset: 0 },
    };
    const lastPage = {
      data: [packageRow('pkg-last')],
      links: { first: '', last: '' },
      meta: { count: EXPORT_PAGE_SIZE + 1, limit: EXPORT_PAGE_SIZE, offset: EXPORT_PAGE_SIZE },
    };
    const createAsyncRequest = jest
      .fn()
      .mockResolvedValueOnce(fullPage)
      .mockResolvedValueOnce(lastPage)
      .mockResolvedValueOnce(defaultCoverageReportItem);

    const result = await fetchData(createAsyncRequest, {
      uuid: 'report-uuid',
      includeSummary: true,
    });

    expect(createAsyncRequest).toHaveBeenNthCalledWith(2, 'content-sources-backend', {
      method: 'GET',
      url: '/api/content-sources/v1/coverage_reports/report-uuid/packages',
      params: { limit: String(EXPORT_PAGE_SIZE), offset: String(EXPORT_PAGE_SIZE) },
    });
    expect(result.packages).toHaveLength(EXPORT_PAGE_SIZE + 1);
    expect(result.packages.at(-1)?.name).toBe('pkg-last');
    expect(result.report).toEqual(defaultCoverageReportItem);
  });
});

describe('buildCoveragePdfPayload', () => {
  it('renders the report as one document so the package table is continuous', () => {
    const payload = buildCoveragePdfPayload({
      uuid: 'report-uuid',
      filename: 'sbom.json',
      generatedAt: '25 Aug 2026',
    });

    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      manifestLocation: '/apps/content-sources/fed-mods.json',
      scope: 'contentSources',
      module: './CoveragePdfEntry',
      fetchDataParams: {
        uuid: 'report-uuid',
        includeSummary: true,
        includePackages: true,
      },
      additionalData: {
        filename: 'sbom.json',
        generatedAt: '25 Aug 2026',
        includeSummary: true,
        includePackages: true,
        headerBrand: 'lightwell',
      },
    });
  });

  it('asks for the report summary only when the package table is omitted', () => {
    const payload = buildCoveragePdfPayload({
      uuid: 'report-uuid',
      filename: 'sbom.json',
      includePackages: false,
      generatedAt: '25 Aug 2026',
    });

    expect(payload).toHaveLength(1);
    expect(payload[0].fetchDataParams).toMatchObject({
      uuid: 'report-uuid',
      includeSummary: true,
      includePackages: false,
    });
    expect(payload[0].additionalData).toMatchObject({
      includeSummary: true,
      includePackages: false,
    });
  });

  it('emits a single task when the filtered set is empty', () => {
    const payload = buildCoveragePdfPayload({ uuid: 'report-uuid' });

    expect(payload).toHaveLength(1);
    expect(payload[0].fetchDataParams).toMatchObject({ uuid: 'report-uuid', includeSummary: true });
  });

  it('defaults the generated date to a UTC display date', () => {
    expect(formatCoveragePdfGeneratedAt(new Date('2026-08-25T22:58:00Z'))).toBe('25 Aug 2026');

    const payload = buildCoveragePdfPayload({ uuid: 'report-uuid' });
    expect(payload[0].additionalData).toEqual(
      expect.objectContaining({ generatedAt: formatCoveragePdfGeneratedAt() }),
    );
  });
});
