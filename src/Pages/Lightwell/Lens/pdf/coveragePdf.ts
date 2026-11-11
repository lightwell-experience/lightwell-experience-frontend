import type { FetchData, PDFRequestPayload } from '@redhat-cloud-services/types';

import type {
  CompletedCoverageReport,
  CoverageReportPackage,
  CoverageReportPackageFilters,
  CoverageReportPackagesListResponse,
} from 'services/Lightwell/CoverageReportsApi';
import type { Meta } from 'services/Lightwell/types';

export const COVERAGE_PDF_MANIFEST = '/apps/lightwell-experience/fed-mods.json';
export const COVERAGE_PDF_SCOPE = 'lightwellExperience';
export const COVERAGE_PDF_MODULE = './CoveragePdfEntry';
export const COVERAGE_REPORTS_PATH = '/api/content-sources/v1/coverage_reports/';

// A package count is known before rendering; the PDF's page count is not.
export const COVERAGE_PDF_MAX_PACKAGES = 1500;

// Rows requested per packages call. The coverage packages endpoint serves up to
// 1000 rows a page; a backend still on the global 200-row cap clamps the request,
// and fetchData pages by the limit the server reports, so either way is complete.
export const COVERAGE_PDF_PAGE_SIZE = 1000;

export function formatCoveragePdfGeneratedAt(date: Date = new Date()): string {
  const day = date.getUTCDate();
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export type CoveragePdfFetchParams = {
  uuid: string;
  offset?: number;
  filters?: CoverageReportPackageFilters;
  includeSummary?: boolean;
  // When false, the package table is omitted and only the report summary is loaded.
  includePackages?: boolean;
};

export type CoveragePdfAdditionalData = {
  filename?: string;
  generatedAt: string;
  includeSummary: boolean;
  // When false, the CVEs-fixed summary and the CVE table columns are omitted.
  includeCveData: boolean;
  // When false, the package table is omitted from the document.
  includePackages: boolean;
  headerBrand: 'lightwell';
};

export type CoveragePdfData = {
  packages: CoverageReportPackage[];
  meta: Meta;
  report: CompletedCoverageReport | null;
};

export function buildCoveragePackagesQueryParams(
  filters?: CoverageReportPackageFilters,
  pagination?: { limit: number; offset: number },
): Record<string, string> {
  const params: Record<string, string> = {
    limit: (pagination?.limit ?? COVERAGE_PDF_PAGE_SIZE).toString(),
    offset: (pagination?.offset ?? 0).toString(),
  };

  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.match_status?.length) {
    params.match_status = filters.match_status.join(',');
  }
  if (filters?.ecosystem?.length) {
    params.ecosystem = filters.ecosystem.join(',');
  }

  return params;
}

function isPackagesResponse(value: unknown): value is CoverageReportPackagesListResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as CoverageReportPackagesListResponse).data) &&
    typeof (value as CoverageReportPackagesListResponse).meta === 'object'
  );
}

function isCompletedReport(value: unknown): value is CompletedCoverageReport {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as CompletedCoverageReport).status === 'completed'
  );
}

export const fetchData = async (
  createAsyncRequest: Parameters<FetchData>[0],
  options?: CoveragePdfFetchParams,
): Promise<CoveragePdfData> => {
  const uuid = options?.uuid;
  if (!uuid) {
    throw new Error('Coverage report PDF export requires a report uuid');
  }

  // Overview-only: the summary lives on the report itself, so skip the package pages.
  if (options?.includePackages === false) {
    let report: CompletedCoverageReport | null = null;
    if (options.includeSummary !== false) {
      const reportResponse = await createAsyncRequest('content-sources-backend', {
        method: 'GET',
        url: `${COVERAGE_REPORTS_PATH}${encodeURIComponent(uuid)}`,
      });
      report = isCompletedReport(reportResponse) ? reportResponse : null;
    }

    return {
      packages: [],
      meta: { count: 0, limit: COVERAGE_PDF_PAGE_SIZE, offset: options.offset ?? 0 },
      report,
    };
  }

  const startOffset = options?.offset ?? 0;

  const packagesRequest = (offset: number) =>
    createAsyncRequest('content-sources-backend', {
      method: 'GET',
      url: `${COVERAGE_REPORTS_PATH}${encodeURIComponent(uuid)}/packages`,
      params: buildCoveragePackagesQueryParams(options?.filters, {
        limit: COVERAGE_PDF_PAGE_SIZE,
        offset,
      }),
    });

  // The per-page packages endpoint carries no coverage summary, so the report is
  // fetched separately and only for the first (cover) page that renders the
  // summary. It is independent of the package pages, so it starts immediately.
  const reportRequest = options?.includeSummary
    ? createAsyncRequest('content-sources-backend', {
        method: 'GET',
        url: `${COVERAGE_REPORTS_PATH}${encodeURIComponent(uuid)}`,
      })
    : null;
  // It is awaited only after the first package page, so mark it handled now; a
  // first-page failure must not leave its rejection unobserved. Awaiting the
  // original promise below still surfaces the error.
  reportRequest?.catch(() => undefined);

  // The first page is fetched on its own to learn the total count; every
  // remaining page is then requested in parallel instead of waterfalling one
  // round trip after another.
  const firstResponse = await packagesRequest(startOffset);
  if (!isPackagesResponse(firstResponse)) {
    throw new Error('Unexpected coverage report packages response');
  }
  const meta = firstResponse.meta;

  // One printed document, so the table flows across PDF pages instead of
  // leaving a gap where a separate slice would start. Pages are stepped by the
  // limit the server actually served, which can be below the requested size when
  // the backend clamps it; stepping by the request would skip rows. A short final
  // page (fewer rows than the served limit) means there is nothing left to fetch.
  const pageSize = meta.limit > 0 ? meta.limit : firstResponse.data.length;
  const remainingOffsets: number[] = [];
  if (pageSize > 0 && firstResponse.data.length === pageSize) {
    for (let offset = startOffset + pageSize; offset < meta.count; offset += pageSize) {
      remainingOffsets.push(offset);
    }
  }

  const [remainingResponses, reportResponse] = await Promise.all([
    Promise.all(remainingOffsets.map(packagesRequest)),
    reportRequest,
  ]);

  const packages: CoverageReportPackage[] = [...firstResponse.data];
  for (const packagesResponse of remainingResponses) {
    if (!isPackagesResponse(packagesResponse)) {
      throw new Error('Unexpected coverage report packages response');
    }
    packages.push(...packagesResponse.data);
  }

  const report = isCompletedReport(reportResponse) ? reportResponse : null;

  return {
    packages,
    meta,
    report,
  };
};

export function buildCoveragePdfPayload({
  uuid,
  filename,
  filters,
  includeCveData = true,
  includePackages = true,
  generatedAt = formatCoveragePdfGeneratedAt(),
}: {
  uuid: string;
  filename?: string;
  filters?: CoverageReportPackageFilters;
  includeCveData?: boolean;
  includePackages?: boolean;
  generatedAt?: string;
}): PDFRequestPayload[] {
  return [
    {
      manifestLocation: COVERAGE_PDF_MANIFEST,
      scope: COVERAGE_PDF_SCOPE,
      module: COVERAGE_PDF_MODULE,
      fetchDataParams: {
        uuid,
        filters,
        includeSummary: true,
        includePackages,
      },
      additionalData: {
        filename,
        generatedAt,
        includeSummary: true,
        includeCveData,
        includePackages,
        headerBrand: 'lightwell',
      } satisfies CoveragePdfAdditionalData,
    },
  ];
}
