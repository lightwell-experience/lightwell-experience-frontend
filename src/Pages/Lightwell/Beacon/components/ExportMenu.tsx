import type { PDFRequestPayload } from '@redhat-cloud-services/types';

import { getVulnerabilities, type BeaconVulnerabilityFilters } from 'services/Lightwell/BeaconApi';
import type { Vulnerability } from '../types';

import { buildBeaconPdfPayload } from '../pdf/beaconPdf';
import { fetchAllPages, resolvePdfItemCount } from '../../utils/exportUtils';
import { ExportMenu as ExportMenuBase } from '../../components/ExportMenu';
import type { VulnerabilityTableColumn } from '../utils/vulnerabilityTableColumns';

type ExportMenuProps = {
  customerId?: string;
  filters?: BeaconVulnerabilityFilters;
  visibleColumns: Pick<VulnerabilityTableColumn, 'key' | 'title'>[];
  itemCount?: number;
  lastUpdated?: string;
};

export function fetchAllFilteredVulnerabilities(
  customerId: string,
  filters?: BeaconVulnerabilityFilters,
): Promise<Vulnerability[]> {
  return fetchAllPages((pageSize, pageIndex) =>
    getVulnerabilities(customerId, filters, {
      limit: pageSize,
      offset: pageIndex * pageSize,
    }).then(({ vulnerabilities }) => vulnerabilities),
  );
}

export function ExportMenu({
  customerId,
  filters,
  visibleColumns,
  itemCount = 0,
  lastUpdated,
}: ExportMenuProps) {
  return (
    <ExportMenuBase
      isReady={Boolean(customerId)}
      ouiaId='lightwell-beacon-export-toggle'
      csvFilename='lightwell-vulnerabilities.csv'
      jsonFilename='lightwell-vulnerabilities.json'
      fetchRows={() => fetchAllFilteredVulnerabilities(customerId!, filters)}
      buildPdfRequest={async () => {
        const count = await resolvePdfItemCount(itemCount, () =>
          getVulnerabilities(customerId!, filters, { limit: 1, offset: 0 }).then(
            ({ meta }) => meta.count,
          ),
        );
        return {
          filename: `lightwell-beacon-${customerId}.pdf`,
          payload: buildBeaconPdfPayload({
            customerId: customerId!,
            filters,
            visibleColumns,
            itemCount: count,
            lastUpdated,
          }) as unknown as PDFRequestPayload,
        };
      }}
      errorNotification={{
        title: 'Error exporting vulnerabilities',
        message: 'Unable to export vulnerabilities',
        id: 'beacon-export-error',
      }}
    />
  );
}
