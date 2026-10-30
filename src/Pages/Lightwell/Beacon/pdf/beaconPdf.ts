import type { FetchData, PDFRequestPayload } from '@redhat-cloud-services/types';

import {
  buildVulnerabilityQueryParams,
  mapCollectionMeta,
  mapLightwellVulnerability,
  VULNERABILITIES_PATH,
  type BeaconData,
  type BeaconVulnerabilityFilters,
  type LightwellVulnerabilityCollectionResponse,
} from 'services/Lightwell/BeaconApi';
import type { VulnerabilityTableColumn } from '../utils/vulnerabilityTableColumns';

export const BEACON_PDF_MANIFEST = '/apps/content-sources/fed-mods.json';
export const BEACON_PDF_SCOPE = 'contentSources';
export const BEACON_PDF_MODULE = './BeaconPdfEntry';
export const BEACON_PDF_PAGE_SIZE = 50;

export function formatBeaconPdfGeneratedAt(date: Date = new Date()): string {
  const day = date.getUTCDate();
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export type BeaconPdfColumn = Pick<VulnerabilityTableColumn, 'key' | 'title'>;

/** Approximate character widths used to pick portrait vs landscape. */
const COLUMN_PDF_WIDTH: Record<string, number> = {
  vulnerabilityId: 14,
  component: 22,
  lastUpdated: 16,
  status: 16,
  publishedVersions: 22,
  severity: 10,
  cvss: 6,
  cvssVector: 28,
  repository: 10,
  batch: 16,
  age: 14,
  flags: 14,
  title: 28,
  customerPriority: 14,
};

const DEFAULT_COLUMN_PDF_WIDTH = 12;
/** A4 portrait comfortably fits the default 4 columns (~68) plus a couple of compact extras. */
export const PORTRAIT_MAX_PDF_WIDTH = 96;
export const LANDSCAPE_MIN_COLUMN_COUNT = 7;

export function shouldUseLandscapePdf(columns: BeaconPdfColumn[]): boolean {
  if (columns.length >= LANDSCAPE_MIN_COLUMN_COUNT) {
    return true;
  }

  const width = columns.reduce(
    (sum, column) => sum + (COLUMN_PDF_WIDTH[column.key] ?? DEFAULT_COLUMN_PDF_WIDTH),
    0,
  );
  return width > PORTRAIT_MAX_PDF_WIDTH;
}

export type BeaconPdfFetchParams = {
  customerId: string;
  limit?: number;
  offset?: number;
  filters?: BeaconVulnerabilityFilters;
};

export type BeaconPdfAdditionalData = {
  visibleColumns: BeaconPdfColumn[];
  includeSummary: boolean;
  generatedAt: string;
  customerId: string;
  headerBrand: 'lightwell';
  landscape: boolean;
  /** True when side-panel filters are applied. Search does not count — same as the page label. */
  isFiltered: boolean;
  lastUpdated?: string;
};

function hasSummaryFilters(filters?: BeaconVulnerabilityFilters): boolean {
  return (
    (filters?.severities?.length ?? 0) > 0 ||
    (filters?.statuses?.length ?? 0) > 0 ||
    (filters?.ltwlsuptTicketIds?.length ?? 0) > 0 ||
    (filters?.flags?.length ?? 0) > 0
  );
}

export type BeaconPdfData = BeaconData;

function isCollectionResponse(value: unknown): value is LightwellVulnerabilityCollectionResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as LightwellVulnerabilityCollectionResponse).data) &&
    typeof (value as LightwellVulnerabilityCollectionResponse).meta === 'object'
  );
}

export const fetchData = async (
  createAsyncRequest: Parameters<FetchData>[0],
  options?: BeaconPdfFetchParams,
): Promise<BeaconPdfData> => {
  const customerId = options?.customerId;
  if (!customerId) {
    throw new Error('Beacon PDF export requires a customerId');
  }

  const response = await createAsyncRequest('content-sources-backend', {
    method: 'GET',
    url: VULNERABILITIES_PATH,
    params: buildVulnerabilityQueryParams(customerId, options?.filters, {
      limit: options?.limit ?? BEACON_PDF_PAGE_SIZE,
      offset: options?.offset ?? 0,
    }),
  });

  if (!isCollectionResponse(response)) {
    throw new Error('Unexpected Beacon vulnerabilities response');
  }

  return {
    vulnerabilities: response.data.map(mapLightwellVulnerability),
    meta: mapCollectionMeta(response.meta),
  } satisfies BeaconPdfData;
};

export function buildBeaconPdfPayload({
  customerId,
  filters,
  visibleColumns,
  itemCount,
  generatedAt = formatBeaconPdfGeneratedAt(),
  lastUpdated,
}: {
  customerId: string;
  filters?: BeaconVulnerabilityFilters;
  visibleColumns: BeaconPdfColumn[];
  itemCount: number;
  generatedAt?: string;
  lastUpdated?: string;
}): PDFRequestPayload[] {
  const pageCount = Math.max(1, Math.ceil(Math.max(itemCount, 0) / BEACON_PDF_PAGE_SIZE));
  const landscape = shouldUseLandscapePdf(visibleColumns);

  return Array.from({ length: pageCount }, (_, pageIndex) => ({
    manifestLocation: BEACON_PDF_MANIFEST,
    scope: BEACON_PDF_SCOPE,
    module: BEACON_PDF_MODULE,
    landscape,
    fetchDataParams: {
      customerId,
      limit: BEACON_PDF_PAGE_SIZE,
      offset: pageIndex * BEACON_PDF_PAGE_SIZE,
      filters,
    },
    additionalData: {
      visibleColumns,
      includeSummary: pageIndex === 0,
      generatedAt,
      customerId,
      headerBrand: 'lightwell',
      landscape,
      isFiltered: hasSummaryFilters(filters),
      lastUpdated,
    } satisfies BeaconPdfAdditionalData,
  }));
}
