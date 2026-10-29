import { useRef, useState } from 'react';
import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import type { PDFRequestPayload } from '@redhat-cloud-services/types';

import {
  getCoverageReportPackages,
  type CoverageReportPackage,
  type CoverageReportPackageFilters,
} from 'services/Lightwell/CoverageReportsApi';

import { buildCoveragePdfPayload, COVERAGE_PDF_MAX_PACKAGES } from '../pdf/coveragePdf';
import { fetchAllPages } from '../../utils/exportUtils';
import { ExportMenu as ExportMenuBase } from '../../components/ExportMenu';

type ExportMenuProps = {
  uuid?: string;
  filename?: string;
  filters?: CoverageReportPackageFilters;
  // When false, CVE columns are empty across the report, so they are stripped
  // from the CSV/JSON rows and omitted from the PDF.
  includeCveData?: boolean;
  // Filtered package total already loaded for the table. When omitted, the PDF
  // action reads the total with a single metadata request.
  packageCount?: number;
};

type PdfSizeDecision = 'overview' | 'csv' | 'json' | 'close';

export function fetchAllCoveragePackages(
  uuid: string,
  filters?: CoverageReportPackageFilters,
): Promise<CoverageReportPackage[]> {
  return fetchAllPages((pageSize, pageIndex) =>
    getCoverageReportPackages(uuid, pageIndex + 1, pageSize, filters).then(({ data }) => data),
  );
}

// Drop the CVE fields so empty data is not exported; see includeCveData.
function stripCveData(
  pkg: CoverageReportPackage,
): Omit<CoverageReportPackage, 'cve_count' | 'cve_range'> {
  const rest: Partial<CoverageReportPackage> = { ...pkg };
  delete rest.cve_count;
  delete rest.cve_range;
  return rest as Omit<CoverageReportPackage, 'cve_count' | 'cve_range'>;
}

export function ExportMenu({
  uuid,
  filename,
  filters,
  includeCveData = true,
  packageCount,
}: ExportMenuProps) {
  const [isPdfLimitModalOpen, setIsPdfLimitModalOpen] = useState(false);
  const decisionRef = useRef<((decision: PdfSizeDecision) => void) | null>(null);
  const overviewOnlyRef = useRef(false);

  const settleDecision = (decision: PdfSizeDecision) => {
    const resolve = decisionRef.current;
    decisionRef.current = null;
    setIsPdfLimitModalOpen(false);
    resolve?.(decision);
  };

  const beforePdfExport = async () => {
    overviewOnlyRef.current = false;
    const count =
      packageCount ?? (await getCoverageReportPackages(uuid!, 1, 1, filters)).meta.count;
    if (count <= COVERAGE_PDF_MAX_PACKAGES) {
      return true;
    }

    const decision = await new Promise<PdfSizeDecision>((resolve) => {
      decisionRef.current = resolve;
      setIsPdfLimitModalOpen(true);
    });
    if (decision === 'overview') {
      overviewOnlyRef.current = true;
      return true;
    }
    return decision === 'close' ? false : decision;
  };

  return (
    <>
      <ExportMenuBase
        isReady={Boolean(uuid)}
        ouiaId='lightwell-coverage-export-toggle'
        csvFilename={`lightwell-match-analysis-${uuid}.csv`}
        jsonFilename={`lightwell-match-analysis-${uuid}.json`}
        fetchRows={async () => {
          const packages = await fetchAllCoveragePackages(uuid!, filters);
          return includeCveData ? packages : packages.map(stripCveData);
        }}
        beforePdfExport={beforePdfExport}
        buildPdfRequest={async () => ({
          filename: `lightwell-match-analysis-${uuid}.pdf`,
          payload: buildCoveragePdfPayload({
            uuid: uuid!,
            filename,
            filters,
            includeCveData,
            includePackages: !overviewOnlyRef.current,
          }) as unknown as PDFRequestPayload,
        })}
        errorNotification={{
          title: 'Error exporting report',
          message: 'Unable to export the match analysis report',
          id: 'coverage-export-error',
        }}
      />
      <Modal
        variant={ModalVariant.medium}
        position='top'
        isOpen={isPdfLimitModalOpen}
        onClose={() => settleDecision('close')}
        aria-labelledby='lightwell-coverage-pdf-too-large-title'
        ouiaId='lightwell-coverage-pdf-too-large'
      >
        <ModalHeader
          title='Package list exceeds PDF export limit'
          labelId='lightwell-coverage-pdf-too-large-title'
        />
        <ModalBody>
          <Content component='p'>
            This list exceeds the {COVERAGE_PDF_MAX_PACKAGES.toLocaleString()}-package PDF limit.
            You can export the overview as a PDF, or filter the list to{' '}
            {COVERAGE_PDF_MAX_PACKAGES.toLocaleString()} packages or fewer.
          </Content>
          <Content component='p'>To export the current package list, use CSV or JSON.</Content>
        </ModalBody>
        <ModalFooter>
          <Button
            variant='primary'
            ouiaId='lightwell-coverage-pdf-export-overview'
            onClick={() => settleDecision('overview')}
          >
            Export overview PDF
          </Button>
          <Button
            variant='secondary'
            ouiaId='lightwell-coverage-pdf-export-csv'
            onClick={() => settleDecision('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant='secondary'
            ouiaId='lightwell-coverage-pdf-export-json'
            onClick={() => settleDecision('json')}
          >
            Export JSON
          </Button>
          <Button
            variant='link'
            ouiaId='lightwell-coverage-pdf-too-large-close'
            onClick={() => settleDecision('close')}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
