import type { AxiosRequestConfig } from 'axios';

import {
  buildCoveragePackagesQueryParams,
  buildCoveragePdfPayload,
  COVERAGE_PDF_PAGE_SIZE,
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

const REPORT_URL = '/api/content-sources/v1/coverage_reports/report-uuid';
const PACKAGES_URL = `${REPORT_URL}/packages`;

const packageRow = (name: string) => ({
  name,
  version: '1',
  ecosystem: 'npm',
  covered: false,
  match_status: 'none' as const,
});

const packagesPage = (
  offset: number,
  length: number,
  count: number,
  limit: number = COVERAGE_PDF_PAGE_SIZE,
) => ({
  data: Array.from({ length }, (_, index) => packageRow(`pkg-${offset + index}`)),
  links: { first: '', last: '' },
  meta: { count, limit, offset },
});

// Routes by URL and offset rather than call order, since pages and the report
// are requested concurrently.
const mockBackend = ({
  pages,
  report = defaultCoverageReportItem,
}: {
  pages: Record<number, unknown>;
  report?: unknown;
}) =>
  jest.fn((_service: string, config: AxiosRequestConfig) => {
    const response = config.url === REPORT_URL ? report : pages[Number(config.params?.offset ?? 0)];
    return response instanceof Error ? Promise.reject(response) : Promise.resolve(response);
  });

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
    const createAsyncRequest = mockBackend({ pages: { 50: packagesCollection } });

    const result = await fetchData(createAsyncRequest, {
      uuid: 'report-uuid',
      offset: 50,
      filters: { match_status: ['exact'] },
      includeSummary: true,
    });

    expect(createAsyncRequest).toHaveBeenCalledTimes(2);
    expect(createAsyncRequest).toHaveBeenCalledWith('content-sources-backend', {
      method: 'GET',
      url: PACKAGES_URL,
      params: { limit: String(COVERAGE_PDF_PAGE_SIZE), offset: '50', match_status: 'exact' },
    });
    expect(createAsyncRequest).toHaveBeenCalledWith('content-sources-backend', {
      method: 'GET',
      url: REPORT_URL,
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
    const count = COVERAGE_PDF_PAGE_SIZE + 1;
    const createAsyncRequest = mockBackend({
      pages: {
        0: packagesPage(0, COVERAGE_PDF_PAGE_SIZE, count),
        [COVERAGE_PDF_PAGE_SIZE]: packagesPage(COVERAGE_PDF_PAGE_SIZE, 1, count),
      },
    });

    const result = await fetchData(createAsyncRequest, {
      uuid: 'report-uuid',
      includeSummary: true,
    });

    expect(createAsyncRequest).toHaveBeenCalledWith('content-sources-backend', {
      method: 'GET',
      url: PACKAGES_URL,
      params: { limit: String(COVERAGE_PDF_PAGE_SIZE), offset: String(COVERAGE_PDF_PAGE_SIZE) },
    });
    expect(result.packages).toHaveLength(count);
    expect(result.packages.at(-1)?.name).toBe(`pkg-${COVERAGE_PDF_PAGE_SIZE}`);
    expect(result.report).toEqual(defaultCoverageReportItem);
  });

  it('keeps offset order when later pages resolve out of order', async () => {
    const count = COVERAGE_PDF_PAGE_SIZE * 3 + 5;
    const pages: Record<number, ReturnType<typeof packagesPage>> = {
      0: packagesPage(0, COVERAGE_PDF_PAGE_SIZE, count),
      [COVERAGE_PDF_PAGE_SIZE]: packagesPage(COVERAGE_PDF_PAGE_SIZE, COVERAGE_PDF_PAGE_SIZE, count),
      [COVERAGE_PDF_PAGE_SIZE * 2]: packagesPage(
        COVERAGE_PDF_PAGE_SIZE * 2,
        COVERAGE_PDF_PAGE_SIZE,
        count,
      ),
      [COVERAGE_PDF_PAGE_SIZE * 3]: packagesPage(COVERAGE_PDF_PAGE_SIZE * 3, 5, count),
    };
    // Earlier offsets settle later, so arrival order is the reverse of offset order.
    const createAsyncRequest = jest.fn((_service: string, config: AxiosRequestConfig) => {
      const offset = Number(config.params?.offset ?? 0);
      const delay = offset === 0 ? 0 : (count - offset) / COVERAGE_PDF_PAGE_SIZE;
      return new Promise((resolve) => setTimeout(() => resolve(pages[offset]), delay));
    });

    const result = await fetchData(createAsyncRequest, { uuid: 'report-uuid' });

    expect(createAsyncRequest).toHaveBeenCalledTimes(4);
    expect(result.packages).toHaveLength(count);
    expect(result.packages.map(({ name }) => name)).toEqual(
      Array.from({ length: count }, (_, index) => `pkg-${index}`),
    );
  });

  it('counts remaining pages from the start offset, not from zero', async () => {
    const start = COVERAGE_PDF_PAGE_SIZE * 2;
    const count = COVERAGE_PDF_PAGE_SIZE * 3 + 1;
    const createAsyncRequest = mockBackend({
      pages: {
        [start]: packagesPage(start, COVERAGE_PDF_PAGE_SIZE, count),
        [start + COVERAGE_PDF_PAGE_SIZE]: packagesPage(start + COVERAGE_PDF_PAGE_SIZE, 1, count),
      },
    });

    const result = await fetchData(createAsyncRequest, { uuid: 'report-uuid', offset: start });

    expect(createAsyncRequest).toHaveBeenCalledTimes(2);
    expect(result.packages).toHaveLength(COVERAGE_PDF_PAGE_SIZE + 1);
  });

  it('pages by the served limit when the backend clamps the requested size', async () => {
    const servedLimit = 200;
    const count = servedLimit * 2 + 50;
    const createAsyncRequest = mockBackend({
      pages: {
        0: packagesPage(0, servedLimit, count, servedLimit),
        [servedLimit]: packagesPage(servedLimit, servedLimit, count, servedLimit),
        [servedLimit * 2]: packagesPage(servedLimit * 2, 50, count, servedLimit),
      },
    });

    const result = await fetchData(createAsyncRequest, { uuid: 'report-uuid' });

    expect(createAsyncRequest).toHaveBeenCalledTimes(3);
    expect(createAsyncRequest).toHaveBeenCalledWith('content-sources-backend', {
      method: 'GET',
      url: PACKAGES_URL,
      params: { limit: String(COVERAGE_PDF_PAGE_SIZE), offset: String(servedLimit * 2) },
    });
    expect(result.packages.map(({ name }) => name)).toEqual(
      Array.from({ length: count }, (_, index) => `pkg-${index}`),
    );
  });

  it('does not leak a rejection when a later page and the report both fail', async () => {
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);
    try {
      const count = COVERAGE_PDF_PAGE_SIZE + 1;
      const createAsyncRequest = mockBackend({
        pages: {
          0: packagesPage(0, COVERAGE_PDF_PAGE_SIZE, count),
          [COVERAGE_PDF_PAGE_SIZE]: new Error('page failed'),
        },
        report: new Error('report failed'),
      });

      await expect(
        fetchData(createAsyncRequest, { uuid: 'report-uuid', includeSummary: true }),
      ).rejects.toThrow(/page failed|report failed/);

      // Let Node report any rejection that was left unobserved.
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });

  it('does not leak the report rejection when the first page fails', async () => {
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);
    try {
      const createAsyncRequest = mockBackend({
        pages: { 0: new Error('first page failed') },
        report: new Error('report failed'),
      });

      await expect(
        fetchData(createAsyncRequest, { uuid: 'report-uuid', includeSummary: true }),
      ).rejects.toThrow('first page failed');

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
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
      manifestLocation: '/apps/lightwell-experience/fed-mods.json',
      scope: 'lightwellExperience',
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
