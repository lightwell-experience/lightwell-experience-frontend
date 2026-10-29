import { useState } from 'react';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import type { PDFRequestPayload } from '@redhat-cloud-services/types';

import type { LwMenuItem } from 'kit/components/primitives';
import useErrorNotification from 'Hooks/useErrorNotification';
import useNotification from 'Hooks/useNotification';
import { getVulnerabilities, type BeaconVulnerabilityFilters } from 'services/Lightwell/BeaconApi';
import { buildBeaconPdfPayload } from '../pdf/beaconPdf';
import { fetchAllFilteredVulnerabilities } from '../components/ExportMenu';
import {
  resolvePdfItemCount,
  exportToCsv,
  exportToJson,
  PDF_GENERATING_NOTIFICATION,
  PDF_READY_NOTIFICATION,
} from '../../utils/exportUtils';
import type { VulnerabilityTableColumn } from '../utils/vulnerabilityTableColumns';

export type UseBeaconExportProps = {
  customerId: string | undefined;
  filters: BeaconVulnerabilityFilters | undefined;
  visibleColumns: Pick<VulnerabilityTableColumn, 'key' | 'title'>[];
  itemCount: number;
  lastUpdated?: string;
};

export type UseBeaconExportResult = {
  isBusy: boolean;
  items: LwMenuItem[];
};

/**
 * Domain export logic for Beacon. Owns exporting state and orchestrates
 * CSV / JSON / PDF export flows. Returns `isBusy` + slot-ready `items`
 * for a caller-owned `LwMenu`.
 */
export function useBeaconExport({
  customerId,
  filters,
  visibleColumns,
  itemCount,
  lastUpdated,
}: UseBeaconExportProps): UseBeaconExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  const { requestPdf } = useChrome();

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    if (!customerId || isExporting) {
      return;
    }

    try {
      setIsExporting(true);

      if (format === 'pdf') {
        notify(PDF_GENERATING_NOTIFICATION);
        const count = await resolvePdfItemCount(itemCount, () =>
          getVulnerabilities(customerId, filters, { limit: 1, offset: 0 }).then(
            ({ meta }) => meta.count,
          ),
        );
        const payload = buildBeaconPdfPayload({
          customerId,
          filters,
          visibleColumns,
          itemCount: count,
          lastUpdated,
        }) as unknown as PDFRequestPayload;
        await requestPdf({ filename: `lightwell-beacon-${customerId}.pdf`, payload });
        notify(PDF_READY_NOTIFICATION);
        return;
      }

      const rows = await fetchAllFilteredVulnerabilities(customerId, filters);

      if (format === 'csv') {
        exportToCsv(rows, 'lightwell-vulnerabilities.csv');
      } else {
        exportToJson(rows, 'lightwell-vulnerabilities.json');
      }
    } catch (err) {
      errorNotifier(
        'Error exporting vulnerabilities',
        'Unable to export vulnerabilities',
        err,
        'beacon-export-error',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isBusy: isExporting,
    items: [
      {
        id: 'csv',
        children: 'Export as CSV',
        isDisabled: isExporting,
        onSelect: () => {
          void handleExport('csv');
        },
      },
      {
        id: 'json',
        children: 'Export as JSON',
        isDisabled: isExporting,
        onSelect: () => {
          void handleExport('json');
        },
      },
      {
        id: 'pdf',
        children: 'Export as PDF',
        isDisabled: isExporting,
        onSelect: () => {
          void handleExport('pdf');
        },
      },
    ],
  };
}
