import type { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';
import type { ManifestUploadCardProps } from './Lens/components/ManifestUploadCard';

export const MOCK_REPORT: CompletedCoverageReport = {
  uuid: 'mock-report',
  status: 'completed',
  created_at: '2026-08-18T00:00:00Z',
  completed_at: '2026-08-18T00:00:01Z',
  total: 1830,
  skipped_entries: 3,
  exact_matches: 1100,
  partial_matches: 270,
  unmatched: 460,
  cve_summary: { critical: 23, important: 76, moderate: 27, low: 15 },
  ecosystem_coverage_summary: [
    {
      ecosystem: 'Python',
      supported: true,
      total: 400,
      exact_matches: 270,
      partial_matches: 70,
      unmatched: 60,
    },
    {
      ecosystem: 'Java',
      supported: true,
      total: 650,
      exact_matches: 450,
      partial_matches: 110,
      unmatched: 90,
    },
    {
      ecosystem: 'Go',
      supported: false,
      total: 150,
      exact_matches: 0,
      partial_matches: 0,
      unmatched: 150,
    },
    {
      ecosystem: 'C#',
      supported: false,
      total: 50,
      exact_matches: 0,
      partial_matches: 0,
      unmatched: 50,
    },
    {
      ecosystem: 'Rust',
      supported: false,
      total: 30,
      exact_matches: 0,
      partial_matches: 0,
      unmatched: 30,
    },
    {
      ecosystem: 'JavaScript',
      supported: true,
      total: 550,
      exact_matches: 380,
      partial_matches: 90,
      unmatched: 80,
    },
  ],
};

const mockUploadProps: ManifestUploadCardProps = {
  file: undefined,
  fileError: undefined,
  processError: undefined,
  step: 'select',
  reportUUID: '',
  onDropAccepted: () => undefined,
  onRetry: () => undefined,
};

export const MOCK_UPLOAD = {
  uploadProps: mockUploadProps,
};

export const MOCK_REPORT_VIEW = {
  filename: 'Vuln-Report_2026-08-18.csv',
  report: MOCK_REPORT,
  isLoading: false,
  isError: false,
  error: null,
  startOver: () => undefined,
};
