import { getEcosystemMatchColor, UNMATCHED_FILL } from './chartTheme';
import type {
  CompletedCoverageReport,
  CoverageMatchStatus,
  EcosystemCoverageSummary,
} from 'services/Lightwell/CoverageReportsApi';
import { formatEcosystemName } from '../utils/ecosystem';

export const getEcosystemBarChartHeight = (ecosystemCount: number): number =>
  75 + ecosystemCount * 55;

export type EcosystemBarDatum = {
  x: string;
  y: number;
  fill: string;
  supported: boolean;
};

export type EcosystemChartLegendItem = {
  id: CoverageMatchStatus;
  label: string;
  fills: string[];
};

type EcosystemChartModel = {
  exactPackages: EcosystemBarDatum[];
  partialPackages: EcosystemBarDatum[];
  unmatchedPackages: EcosystemBarDatum[];
};

export const hasBarData = (bars: EcosystemBarDatum[]): boolean => bars.some(({ y }) => y > 0);

export const orderSummaries = (summaries: EcosystemCoverageSummary[]): EcosystemCoverageSummary[] =>
  [...summaries].sort((a, b) => {
    if (a.supported !== b.supported) return a.supported ? 1 : -1; // Unsupported first
    if (!a.supported) return a.unmatched - b.unmatched; // Compare on the unmatched field for unsupported ecosystems
    if (a.exact_matches === 0 && b.exact_matches === 0) {
      return a.partial_matches - b.partial_matches;
    }
    return a.exact_matches - b.exact_matches;
  });

const getSeriesFill =
  (matchStatus: Exclude<CoverageMatchStatus, 'none'>) =>
  (eco: EcosystemCoverageSummary): string =>
    eco.supported ? getEcosystemMatchColor(eco.ecosystem, matchStatus) : UNMATCHED_FILL;

const toBarSeries = (
  summaries: EcosystemCoverageSummary[],
  getCount: (eco: EcosystemCoverageSummary) => number,
  getFill: (eco: EcosystemCoverageSummary) => string,
): EcosystemBarDatum[] =>
  summaries.map((eco) => ({
    x: eco.ecosystem,
    y: getCount(eco),
    fill: getFill(eco),
    supported: eco.supported,
  }));

export const getEcosystemChartModel = (report: CompletedCoverageReport): EcosystemChartModel => {
  const summaries = orderSummaries(report.ecosystem_coverage_summary);

  return {
    exactPackages: toBarSeries(summaries, (eco) => eco.exact_matches, getSeriesFill('exact')),
    partialPackages: toBarSeries(summaries, (eco) => eco.partial_matches, getSeriesFill('partial')),
    unmatchedPackages: toBarSeries(
      summaries,
      (eco) => eco.unmatched,
      () => UNMATCHED_FILL,
    ),
  };
};

export const formatIntegerTicks = (tick: number): string =>
  Number.isInteger(tick) ? tick.toString() : '';

export const getLegendItems = (model: EcosystemChartModel): EcosystemChartLegendItem[] => [
  {
    id: 'exact',
    label: 'Exact match',
    fills: model.exactPackages.map((bar) => bar.fill),
  },
  {
    id: 'partial',
    label: 'Partial match',
    fills: model.partialPackages.map((bar) => bar.fill),
  },
  {
    id: 'none',
    label: 'No match',
    fills: [UNMATCHED_FILL],
  },
];

export type EcosystemChartA11yTable = {
  columns: string[];
  rows: { ecosystem: string; values: number[] }[];
};

export const getEcosystemChartA11yTable = (model: EcosystemChartModel): EcosystemChartA11yTable => {
  const legendItems = getLegendItems(model);

  const seriesByLegendId = {
    exact: model.exactPackages,
    partial: model.partialPackages,
    none: model.unmatchedPackages,
  };

  return {
    columns: legendItems.map((item) => item.label),
    rows: model.exactPackages.map((bar, index) => ({
      ecosystem: formatEcosystemName(bar.x, bar.supported),
      values: legendItems.map((item) => seriesByLegendId[item.id][index].y),
    })),
  };
};
