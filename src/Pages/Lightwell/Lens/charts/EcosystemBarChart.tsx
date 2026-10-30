import { Content, Flex, FlexItem } from '@patternfly/react-core';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartStack,
  ChartTooltip,
  type ChartBarProps,
} from '@patternfly/react-charts/victory';
import { useMemo, type CSSProperties, type Ref } from 'react';

import {
  CATEGORY_AXIS_STYLE,
  COUNT_AXIS_STYLE,
  ECOSYSTEM_BAR_LEGEND_SWATCH_SIZE,
  ECOSYSTEM_CHART_DOMAIN_PADDING,
  ECOSYSTEM_CHART_PADDING,
} from './chartTheme';
import {
  formatIntegerTicks,
  getEcosystemChartModel,
  getLegendItems,
  type EcosystemBarDatum,
  type EcosystemChartA11yTable,
  type EcosystemChartLegendItem,
  getEcosystemChartA11yTable,
  hasBarData,
} from './ecosystemBarModel';
import type { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';

type EcosystemBarChartBase = {
  report: CompletedCoverageReport;
  width: number;
  height: number;
};

export type EcosystemBarChartWebProps = EcosystemBarChartBase & {
  surface?: 'web';
  containerRef: Ref<HTMLDivElement>;
};

export type EcosystemBarChartPdfProps = EcosystemBarChartBase & {
  surface: 'pdf';
  showLegend?: boolean;
};

export type EcosystemBarChartProps = EcosystemBarChartWebProps | EcosystemBarChartPdfProps;

const BAR_STYLE: ChartBarProps['style'] = {
  data: { fill: ({ datum }) => (datum as EcosystemBarDatum).fill },
};

const getBarTooltipProps = (kind: string) => ({
  labelComponent: <ChartTooltip constrainToVisibleArea />,
  labels: ({ datum }: { datum: EcosystemBarDatum }) =>
    datum.y > 0
      ? `${kind}: ${datum.y} packages${datum.supported ? '' : ' (ecosystem unsupported)'}`
      : null,
});

const getLegendSwatchStyle = (fill: string): CSSProperties => ({
  display: 'block',
  width: ECOSYSTEM_BAR_LEGEND_SWATCH_SIZE,
  height: ECOSYSTEM_BAR_LEGEND_SWATCH_SIZE,
  backgroundColor: fill,
});

type ChartLegendProps = {
  items: EcosystemChartLegendItem[];
};

const ChartLegend = ({ items }: ChartLegendProps) => (
  <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
    {items.map(({ label, fills }) => (
      <FlexItem key={label}>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapXs' }}>
          <FlexItem>
            <Content component='p'>{label}</Content>
          </FlexItem>
          <FlexItem>
            <Flex gap={{ default: 'gapXs' }}>
              {fills.map((fill, index) => (
                <FlexItem key={`${label}-${index}`}>
                  <span style={getLegendSwatchStyle(fill)} />
                </FlexItem>
              ))}
            </Flex>
          </FlexItem>
        </Flex>
      </FlexItem>
    ))}
  </Flex>
);

const ChartA11yTable = ({ columns, rows }: EcosystemChartA11yTable) => (
  <div className='pf-v6-screen-reader'>
    <table>
      <caption>Package matches by ecosystem</caption>
      <thead>
        <tr>
          <th scope='col'>Ecosystem</th>
          {columns.map((column) => (
            <th key={column} scope='col'>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ ecosystem, values }) => (
          <tr key={ecosystem}>
            <th scope='row'>{ecosystem}</th>
            {columns.map((column, index) => (
              <td key={column}>{values[index]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const EcosystemBarChart = (props: EcosystemBarChartProps) => {
  const { report, width, height } = props;
  const isPdf = props.surface === 'pdf';

  const showTooltips = !isPdf;
  const showLegend = isPdf && props.showLegend !== false;
  const containerRef = isPdf ? undefined : props.containerRef;

  const model = useMemo(() => getEcosystemChartModel(report), [report]);
  const { exactPackages, partialPackages, unmatchedPackages } = model;

  const plot = (
    <div ref={containerRef} aria-hidden style={isPdf ? undefined : { width: '100%' }}>
      <Chart
        horizontal
        categories={{ x: exactPackages.map(({ x }) => x) }}
        domainPadding={ECOSYSTEM_CHART_DOMAIN_PADDING}
        height={height}
        width={width}
        padding={ECOSYSTEM_CHART_PADDING}
      >
        <ChartAxis style={CATEGORY_AXIS_STYLE} />
        <ChartAxis
          dependentAxis
          tickFormat={formatIntegerTicks}
          showGrid
          style={COUNT_AXIS_STYLE}
          label={showLegend ? 'Packages' : undefined}
        />
        <ChartStack fillInMissingData={false}>
          {hasBarData(exactPackages) && (
            <ChartBar
              data={exactPackages.filter(({ y }) => y > 0)}
              style={BAR_STYLE}
              {...(showTooltips ? getBarTooltipProps('Exact match') : {})}
            />
          )}
          {hasBarData(partialPackages) && (
            <ChartBar
              data={partialPackages.filter(({ y }) => y > 0)}
              style={BAR_STYLE}
              {...(showTooltips ? getBarTooltipProps('Partial match') : {})}
            />
          )}
          {hasBarData(unmatchedPackages) && (
            <ChartBar
              data={unmatchedPackages.filter(({ y }) => y > 0)}
              style={BAR_STYLE}
              {...(showTooltips ? getBarTooltipProps('No match') : {})}
            />
          )}
        </ChartStack>
      </Chart>
    </div>
  );

  if (!isPdf) {
    // SVG charts are not screen-reader-friendly, so we include an extra table summarizing the data
    const a11yTable = getEcosystemChartA11yTable(model);

    return (
      <>
        {plot}
        <ChartA11yTable {...a11yTable} />
      </>
    );
  }

  if (!showLegend) {
    return plot;
  }

  return (
    <Flex gap={{ default: 'gapLg' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: 0 }}>
        {plot}
      </FlexItem>
      <FlexItem>
        <ChartLegend items={getLegendItems(model)} />
      </FlexItem>
    </Flex>
  );
};

export default EcosystemBarChart;
