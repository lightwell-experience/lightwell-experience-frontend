import { Content, Flex, FlexItem } from '@patternfly/react-core';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartContainer,
  ChartStack,
  ChartTooltip,
  type ChartBarProps,
} from '@patternfly/react-charts/victory';
import type { CSSProperties, Ref } from 'react';

import { mergeClassNames } from 'kit/components/components.config';
import './metrics-stack-chart.css';

export type LwMetricsStackBarDatum = {
  x: string;
  y: number;
  fill: string;
  supported?: boolean;
};

export type LwMetricsStackSeries = {
  id: string;
  label: string;
  data: LwMetricsStackBarDatum[];
};

export type LwMetricsStackA11yTable = {
  caption: string;
  columns: string[];
  rows: { rowHeader: string; values: number[] }[];
};

export type LwMetricsStackLegendItem = {
  id: string;
  label: string;
  fills: string[];
};

const DEFAULT_PADDING = { bottom: 65, left: 100, right: 20, top: 10 };
const DEFAULT_DOMAIN_PADDING = { x: [15, 15] as [number, number] };
const LEGEND_SWATCH_SIZE = 12;

const BAR_STYLE: ChartBarProps['style'] = {
  data: { fill: ({ datum }) => (datum as LwMetricsStackBarDatum).fill },
};

const CATEGORY_AXIS_STYLE = { tickLabels: { fontSize: 14 } };
const COUNT_AXIS_STYLE = {
  tickLabels: { fontSize: 14 },
  axisLabel: { fontSize: 14, padding: 50 },
};

const formatIntegerTicks = (tick: number): string =>
  Number.isInteger(tick) ? tick.toString() : '';

const hasBarData = (bars: LwMetricsStackBarDatum[]): boolean => bars.some(({ y }) => y > 0);

const getBarTooltipProps = (kind: string) => ({
  labelComponent: <ChartTooltip constrainToVisibleArea />,
  labels: ({ datum }: { datum: LwMetricsStackBarDatum }) =>
    datum.y > 0
      ? `${kind}: ${datum.y} packages${datum.supported === false ? ' (ecosystem unsupported)' : ''}`
      : null,
});

const getLegendSwatchStyle = (fill: string): CSSProperties => ({
  display: 'block',
  width: LEGEND_SWATCH_SIZE,
  height: LEGEND_SWATCH_SIZE,
  backgroundColor: fill,
});

type ChartLegendProps = {
  items: LwMetricsStackLegendItem[];
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

const ChartA11yTable = ({ caption, columns, rows }: LwMetricsStackA11yTable) => (
  <div className='pf-v6-screen-reader'>
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope='col'>Category</th>
          {columns.map((column) => (
            <th key={column} scope='col'>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ rowHeader, values }) => (
          <tr key={rowHeader}>
            <th scope='row'>{rowHeader}</th>
            {columns.map((column, index) => (
              <td key={column}>{values[index]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export type LwMetricsStackChartProps = {
  series: LwMetricsStackSeries[];
  width: number;
  height: number;
  containerRef?: Ref<HTMLDivElement>;
  allowTooltip?: boolean;
  showLegend?: boolean;
  legendItems?: LwMetricsStackLegendItem[];
  a11yTable?: LwMetricsStackA11yTable;
  padding?: { bottom?: number; left?: number; right?: number; top?: number };
  className?: string;
};

/**
 * Kit **assembly** — PF stacked horizontal bar harness.
 * Call site owns series builders, fills, and resize measurement.
 */
export function LwMetricsStackChart({
  series,
  width,
  height,
  containerRef,
  allowTooltip = true,
  showLegend = false,
  legendItems,
  a11yTable,
  padding = DEFAULT_PADDING,
  className,
}: LwMetricsStackChartProps) {
  const plot = (
    <div
      ref={containerRef}
      aria-hidden
      className={mergeClassNames('lw-c-metrics-stack-chart__plot', className)}
      style={{ width: '100%' }}
    >
      <Chart
        horizontal
        containerComponent={<ChartContainer responsive={false} />}
        domainPadding={DEFAULT_DOMAIN_PADDING}
        height={height}
        width={width}
        padding={padding}
      >
        <ChartAxis style={CATEGORY_AXIS_STYLE} />
        <ChartAxis
          dependentAxis
          tickFormat={formatIntegerTicks}
          showGrid
          style={COUNT_AXIS_STYLE}
          label={showLegend ? 'Packages' : undefined}
        />
        <ChartStack>
          {series.map((layer) => (
            <ChartBar
              key={layer.id}
              data={layer.data}
              style={BAR_STYLE}
              {...(allowTooltip && hasBarData(layer.data) ? getBarTooltipProps(layer.label) : {})}
            />
          ))}
        </ChartStack>
      </Chart>
    </div>
  );

  if (showLegend && legendItems != null) {
    return (
      <div className={mergeClassNames('lw-c-metrics-stack-chart', className)}>
        <Flex gap={{ default: 'gapLg' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: 0 }}>
            {plot}
          </FlexItem>
          <FlexItem>
            <ChartLegend items={legendItems} />
          </FlexItem>
        </Flex>
      </div>
    );
  }

  return (
    <div className={mergeClassNames('lw-c-metrics-stack-chart', className)}>
      {plot}
      {a11yTable != null ? <ChartA11yTable {...a11yTable} /> : null}
    </div>
  );
}

export default LwMetricsStackChart;
