import type { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';

export const COVERAGE_DONUT_WIDTH = 320;
export const COVERAGE_DONUT_HEIGHT = 280;
export const COVERAGE_DONUT_PADDING = { bottom: 10, left: 10, right: 10, top: 10 };
export const COVERAGE_DONUT_TITLE_LINE_HEIGHT = 1.6;

type MatchCounts = Pick<CompletedCoverageReport, 'exact_matches' | 'partial_matches' | 'total'>;

export const getMatchedPackagePercentage = ({
  exact_matches,
  partial_matches,
  total,
}: MatchCounts): number =>
  total > 0 ? Math.round(((exact_matches + partial_matches) / total) * 100) : 0;

export const getMatchDonutChartHeight = (width: number): number =>
  Math.round((width * COVERAGE_DONUT_HEIGHT) / COVERAGE_DONUT_WIDTH);

export type DonutDatum = {
  x: string;
  y: number;
};

export const getDonutData = (report: CompletedCoverageReport): DonutDatum[] => [
  { x: 'Exact match', y: report.exact_matches },
  { x: 'Partial match', y: report.partial_matches },
  { x: 'No match', y: report.unmatched },
];

export const getDonutLabel = ({ datum }: { datum: DonutDatum }): string =>
  `${datum.x}: ${datum.y} packages`;
