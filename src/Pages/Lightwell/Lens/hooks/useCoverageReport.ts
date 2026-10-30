import { useLocation } from 'react-router-dom';
import { useCoverageReportQuery } from 'services/Lightwell/CoverageReportsQueries';
import type { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';
import { useLightwellNavigateTo } from 'Hooks/Lightwell/navigation/useLightwellNavigateTo';
import { LIGHTWELL_LENS_USE_MOCK } from 'Pages/Lightwell/constants';
import { MOCK_REPORT_VIEW } from '../../mockCoverageAnalysis';

export const useCoverageReport = (reportUUID: string | undefined) => {
  if (LIGHTWELL_LENS_USE_MOCK) return MOCK_REPORT_VIEW;

  const { navigateToLens } = useLightwellNavigateTo();
  const location = useLocation();
  const filename = (location.state as { filename?: string } | null)?.filename;

  const { data, isLoading, isError, error } = useCoverageReportQuery(reportUUID ?? '', false);

  const report: CompletedCoverageReport | undefined =
    data && data.status === 'completed' ? data : undefined;

  const startOver = () => navigateToLens();

  return {
    filename,
    report,
    isLoading,
    isError,
    error,
    startOver,
  };
};
