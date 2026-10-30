import { AlertVariant } from '@patternfly/react-core';

type ExportRow = Record<string, unknown>;

export type ExportFormat = 'csv' | 'pdf' | 'json';

export const EXPORT_PAGE_SIZE = 200;

// Notification payloads shared by every export menu so the PDF flow reads
// identically across pages.
export const PDF_GENERATING_NOTIFICATION = {
  variant: AlertVariant.info,
  title: 'Generating PDF',
  description: 'Your PDF is being generated. The download will start when it is ready.',
} as const;

export const PDF_READY_NOTIFICATION = {
  variant: AlertVariant.success,
  title: 'PDF ready',
  description: 'Your download should start shortly.',
} as const;

// Fetch every item across a paginated endpoint. `fetchPage` receives the page
// size and a zero-based page index and returns just that page of items; the
// caller converts the index into whatever cursor the endpoint expects (an
// `offset` of `pageIndex * pageSize`, a 1-based `pageIndex + 1`, etc.).
export async function fetchAllPages<T>(
  fetchPage: (pageSize: number, pageIndex: number) => Promise<T[]>,
  pageSize: number = EXPORT_PAGE_SIZE,
): Promise<T[]> {
  const items: T[] = [];
  let pageIndex = 0;

  while (true) {
    const page = await fetchPage(pageSize, pageIndex);
    items.push(...page);

    if (page.length < pageSize) {
      break;
    }

    pageIndex += 1;
  }

  return items;
}

// Resolve the total item count for a PDF export, preferring a count the caller
// already has and otherwise falling back to a lightweight metadata request.
export async function resolvePdfItemCount(
  itemCount: number,
  fetchCount: () => Promise<number>,
): Promise<number> {
  if (itemCount > 0) {
    return itemCount;
  }

  return fetchCount();
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Prevent CSV formula injection: spreadsheet apps treat cells starting with
// these characters as formulas, so prefix them with a single quote to keep the
// value inert while it still reads as text. This also handles leading tabs or
// carriage returns, and whitespace before =, +, -, or @.
function neutralizeFormula(value: string): string {
  if (/^[\t\r]|^\s*[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function csvValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'object') {
    return csvCell(neutralizeFormula(JSON.stringify(value)));
  }
  return csvCell(neutralizeFormula(String(value)));
}

function csvKeys(rows: readonly ExportRow[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  }

  return keys;
}

export function buildCsv<T extends object>(rows: readonly T[]): string {
  const records = rows as readonly ExportRow[];
  const keys = csvKeys(records);
  if (keys.length === 0) {
    return '';
  }

  const body = records.map((row) => keys.map((key) => csvValue(row[key])).join(','));

  return [keys.map(csvCell).join(','), ...body].join('\n');
}

function downloadBlob(content: string, type: string, filename: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToCsv<T extends object>(rows: T[], filename: string): void {
  downloadBlob(buildCsv(rows), 'text/csv;charset=utf-8;', filename);
}

export function exportToJson<T>(rows: T[], filename: string): void {
  downloadBlob(JSON.stringify(rows, null, 2), 'application/json;charset=utf-8;', filename);
}
