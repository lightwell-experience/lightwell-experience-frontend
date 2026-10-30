import { useState } from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Spinner,
  type MenuToggleElement,
} from '@patternfly/react-core';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import type { PDFRequestPayload } from '@redhat-cloud-services/types';

import useErrorNotification from 'Hooks/useErrorNotification';
import useNotification from 'Hooks/useNotification';
import {
  exportToCsv,
  exportToJson,
  PDF_GENERATING_NOTIFICATION,
  PDF_READY_NOTIFICATION,
  type ExportFormat,
} from '../utils/exportUtils';

export type ExportPdfRequest = {
  filename: string;
  payload: PDFRequestPayload;
};

export type ExportMenuProps = {
  // Whether the underlying data is addressable yet (e.g. an id is present).
  // Gates the toggle and the export handler.
  isReady: boolean;
  ouiaId: string;
  csvFilename: string;
  jsonFilename: string;
  // Fetch every row to serialize for the CSV/JSON exports.
  fetchRows: () => Promise<object[]>;
  // Build the filename + payload for the split PDF export.
  buildPdfRequest: () => Promise<ExportPdfRequest>;
  // Runs before a PDF export starts. Return false to cancel or another format
  // to continue through the existing CSV/JSON export path.
  beforePdfExport?: () => Promise<boolean | Exclude<ExportFormat, 'pdf'>>;
  errorNotification: {
    title: string;
    message: string;
    id: string;
  };
};

// Shared Export dropdown (CSV / JSON / PDF). Owns the open/exporting state and
// the notify + error orchestration; page-specific behavior arrives via props.
export function ExportMenu({
  isReady,
  ouiaId,
  csvFilename,
  jsonFilename,
  fetchRows,
  buildPdfRequest,
  beforePdfExport,
  errorNotification,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  const { requestPdf } = useChrome();

  const handleExport = async (format: ExportFormat) => {
    if (!isReady || isExporting || isPreparingPdf) {
      return;
    }

    setIsOpen(false);
    try {
      let selectedFormat = format;
      if (format === 'pdf' && beforePdfExport) {
        setIsPreparingPdf(true);
        const decision = await beforePdfExport();
        setIsPreparingPdf(false);
        if (decision === false) {
          return;
        }
        if (decision !== true) {
          selectedFormat = decision;
        }
      }

      setIsExporting(true);
      if (selectedFormat === 'pdf') {
        notify(PDF_GENERATING_NOTIFICATION);
        const { filename, payload } = await buildPdfRequest();
        await requestPdf({ filename, payload });
        notify(PDF_READY_NOTIFICATION);
        return;
      }

      const rows = await fetchRows();

      if (selectedFormat === 'csv') {
        exportToCsv(rows, csvFilename);
      } else {
        exportToJson(rows, jsonFilename);
      }
    } catch (err) {
      setIsPreparingPdf(false);
      errorNotifier(errorNotification.title, errorNotification.message, err, errorNotification.id);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!isExporting && !isPreparingPdf) {
          setIsOpen(open);
        }
      }}
      popperProps={{ position: 'right' }}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
          isDisabled={!isReady || isExporting || isPreparingPdf}
          variant='secondary'
          ouiaId={ouiaId}
          aria-busy={isExporting}
          icon={isExporting ? <Spinner size='sm' aria-hidden='true' /> : undefined}
        >
          {isExporting ? 'Exporting' : 'Export as'}
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem
          key='csv'
          isDisabled={isExporting}
          onClick={() => {
            void handleExport('csv');
          }}
        >
          CSV
        </DropdownItem>
        <DropdownItem
          key='json'
          isDisabled={isExporting}
          onClick={() => {
            void handleExport('json');
          }}
        >
          JSON
        </DropdownItem>
        <DropdownItem
          key='pdf'
          isDisabled={isExporting}
          onClick={() => {
            void handleExport('pdf');
          }}
        >
          PDF
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}
