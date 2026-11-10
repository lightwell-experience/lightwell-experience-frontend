import { useMemo } from 'react';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartTooltip,
  type ChartBarProps,
} from '@patternfly/react-charts/victory';

import type { ClearinghousePackageEcosystemSummary } from 'services/Lightwell/ClearinghouseApi';

import {
  CATEGORY_AXIS_STYLE,
  COUNT_AXIS_STYLE,
  ECOSYSTEM_CHART_DOMAIN_PADDING,
  UNMATCHED_FILL,
  getEcosystemMatchColor,
} from '../../Lens/charts/chartTheme';
import { formatIntegerTicks } from '../../Lens/charts/ecosystemBarModel';
import { useContainerWidth } from '../../hooks/useContainerWidth';
import { pluralizePackages } from './SubmissionPackageSummary';

/** Ecosystem the backend reports for packageurls that don't parse as a Package URL. */
export const UNKNOWN_ECOSYSTEM = 'Unknown';

const CHART_DEFAULT_WIDTH = 400;
const CHART_PADDING = { bottom: 40, left: 100, right: 20, top: 10 };

export const getSubmissionEcosystemChartHeight = (ecosystemCount: number): number =>
  CHART_PADDING.top + CHART_PADDING.bottom + 30 + ecosystemCount * 35;

type EcosystemBarDatum = { x: string; y: number; fill: string };

const BAR_STYLE: ChartBarProps['style'] = {
  data: { fill: ({ datum }) => (datum as EcosystemBarDatum).fill },
};

const getFill = (ecosystem: string) =>
  ecosystem === UNKNOWN_ECOSYSTEM ? UNMATCHED_FILL : getEcosystemMatchColor(ecosystem, 'exact');

export type SubmissionEcosystemChartProps = {
  /** Per-ecosystem totals, largest first (as returned by the backend). */
  ecosystems: ClearinghousePackageEcosystemSummary[];
};

/**
 * Horizontal bar chart of a submission's unique packages per ecosystem, styled
 * like the Lens ecosystem breakdown (same axes and ecosystem colors; packageurls
 * that don't parse are grouped under a grey "Unknown" bar). Includes a
 * screen-reader table since the SVG is hidden from assistive technology.
 */
const SubmissionEcosystemChart = ({ ecosystems }: SubmissionEcosystemChartProps) => {
  const { containerRef, width } = useContainerWidth(CHART_DEFAULT_WIDTH);

  // Victory draws the first horizontal category at the bottom; reverse so the
  // largest ecosystem sits on top.
  const data = useMemo<EcosystemBarDatum[]>(
    () =>
      [...ecosystems]
        .reverse()
        .map(({ ecosystem, total }) => ({ x: ecosystem, y: total, fill: getFill(ecosystem) })),
    [ecosystems],
  );

  return (
    <>
      {/* Measuring host for the chart width (block flow already fills the row). */}
      <div ref={containerRef} aria-hidden>
        <Chart
          horizontal
          categories={{ x: data.map(({ x }) => x) }}
          domainPadding={ECOSYSTEM_CHART_DOMAIN_PADDING}
          height={getSubmissionEcosystemChartHeight(ecosystems.length)}
          width={width}
          padding={CHART_PADDING}
        >
          <ChartAxis style={CATEGORY_AXIS_STYLE} />
          <ChartAxis
            dependentAxis
            tickFormat={formatIntegerTicks}
            showGrid
            style={COUNT_AXIS_STYLE}
          />
          <ChartBar
            data={data}
            style={BAR_STYLE}
            barWidth={20}
            labelComponent={<ChartTooltip constrainToVisibleArea />}
            labels={({ datum }: { datum: EcosystemBarDatum }) =>
              `${datum.x}: ${pluralizePackages(datum.y)}`
            }
          />
        </Chart>
      </div>
      <div className='pf-v6-screen-reader'>
        <table>
          <caption>Packages by ecosystem</caption>
          <thead>
            <tr>
              <th scope='col'>Ecosystem</th>
              <th scope='col'>Packages</th>
            </tr>
          </thead>
          <tbody>
            {ecosystems.map(({ ecosystem, total }) => (
              <tr key={ecosystem}>
                <th scope='row'>{ecosystem}</th>
                <td>{total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SubmissionEcosystemChart;
