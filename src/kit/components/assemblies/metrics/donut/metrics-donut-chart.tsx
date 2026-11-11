import { ChartContainer, ChartDonut, ChartLabel } from '@patternfly/react-charts/victory';
import { chart_donut_label_subtitle_Fill } from '@patternfly/react-tokens/dist/esm/chart_donut_label_subtitle_Fill';
import { chart_donut_label_title_Fill } from '@patternfly/react-tokens/dist/esm/chart_donut_label_title_Fill';
import { chart_global_FontSize_sm } from '@patternfly/react-tokens/dist/esm/chart_global_FontSize_sm';
import { chart_global_FontSize_xs } from '@patternfly/react-tokens/dist/esm/chart_global_FontSize_xs';
import { t_global_font_weight_heading_bold } from '@patternfly/react-tokens/dist/esm/t_global_font_weight_heading_bold';
import type { CSSProperties, Ref } from 'react';

import { mergeClassNames } from 'kit/components/components.config';
import { lightwellConfig } from 'kit/lightwell.config';
import './metrics-donut-chart.css';

export type LwMetricsDonutDatum = {
  x: string;
  y: number;
};

const DEFAULT_PADDING = { bottom: 10, left: 10, right: 10, top: 10 };
const DEFAULT_TITLE_LINE_HEIGHT = 1.6;
// PF draws a 9px band when innerRadius is omitted. This share of the outer radius is the ring.
const RING_THICKNESS_RATIO = 0.14;

const getInnerRadius = (
  width: number,
  height: number,
  padding: { bottom?: number; left?: number; right?: number; top?: number },
): number => {
  const radius =
    Math.min(
      width - (padding.left ?? 0) - (padding.right ?? 0),
      height - (padding.top ?? 0) - (padding.bottom ?? 0),
    ) / 2;
  return radius * (1 - RING_THICKNESS_RATIO);
};

const DEFAULT_TITLE_STYLE: CSSProperties[] = [
  {
    fill: chart_donut_label_title_Fill.var,
    fontSize: chart_global_FontSize_xs.value * 3,
    fontWeight: t_global_font_weight_heading_bold.var,
  },
  {
    fill: chart_donut_label_subtitle_Fill.var,
    fontSize: chart_global_FontSize_sm.value,
  },
];

const DEFAULT_COLOR_SCALE = [
  lightwellConfig.colors.matchStatus.exact,
  lightwellConfig.colors.matchStatus.partial,
  lightwellConfig.colors.matchStatus.none,
];

/**
 * Where the HTML legend sits. `responsive` is beside the ring below `lg` (62rem) and
 * under it from `lg` up — the page-chrome-slot breakpoint (slots stack, then sit side
 * by side). See the unit ROADMAP § Legend.
 */
export type LwMetricsDonutLegendPosition = 'right' | 'bottom' | 'responsive';

export type LwMetricsDonutChartProps = {
  data: LwMetricsDonutDatum[];
  width: number;
  height: number;
  title: string;
  subTitle?: string;
  colorScale?: string[];
  ariaDesc?: string;
  allowTooltip?: boolean;
  getLabel?: (args: { datum: LwMetricsDonutDatum }) => string;
  /** Render an HTML legend built from `data` + `colorScale`. */
  showLegend?: boolean;
  legendPosition?: LwMetricsDonutLegendPosition;
  /** Row text. Default `${x}: ${y}`. Pass the same formatter as `getLabel` to keep tooltips in step. */
  formatLegendLabel?: (args: { datum: LwMetricsDonutDatum }) => string;
  /** Accessible name of the legend list. Defaults to `ariaDesc`. */
  legendAriaLabel?: string;
  containerRef?: Ref<HTMLDivElement>;
  padding?: { bottom?: number; left?: number; right?: number; top?: number };
  className?: string;
};

const formatDefaultLegendLabel = ({ datum }: { datum: LwMetricsDonutDatum }): string =>
  `${datum.x}: ${datum.y}`;

/**
 * Kit **assembly** — PF `ChartDonut` harness for match / utilization metrics.
 * Call site owns series builders and resize measurement.
 */
export function LwMetricsDonutChart({
  data,
  width,
  height,
  title,
  subTitle,
  colorScale = DEFAULT_COLOR_SCALE,
  ariaDesc = 'Donut chart',
  allowTooltip = true,
  getLabel,
  showLegend = false,
  legendPosition = 'right',
  formatLegendLabel = formatDefaultLegendLabel,
  legendAriaLabel,
  containerRef,
  padding = DEFAULT_PADDING,
  className,
}: LwMetricsDonutChartProps) {
  const chart = (
    <ChartDonut
      ariaDesc={ariaDesc}
      constrainToVisibleArea
      // PF's responsive container has no intrinsic width, so a flex row would collapse
      // the ring. With a legend, give the plot its own box. Without one, leave PF's
      // default (fill the host) so call-site measurement keeps working.
      containerComponent={
        showLegend ? (
          <ChartContainer className='lw-c-metrics-donut-chart__plot' style={{ width, height }} />
        ) : undefined
      }
      data={data}
      colorScale={colorScale}
      allowTooltip={allowTooltip}
      labels={allowTooltip && getLabel ? getLabel : undefined}
      title={title}
      subTitle={subTitle}
      titleComponent={
        <ChartLabel lineHeight={DEFAULT_TITLE_LINE_HEIGHT} style={DEFAULT_TITLE_STYLE} />
      }
      width={width}
      height={height}
      padding={padding}
      innerRadius={getInnerRadius(width, height, padding)}
    />
  );

  return (
    <div
      ref={containerRef}
      className={mergeClassNames(
        'lw-c-metrics-donut-chart',
        showLegend ? `lw-m-legend lw-m-legend-${legendPosition}` : undefined,
        className,
      )}
    >
      {chart}
      {showLegend ? (
        <ul className='lw-c-metrics-donut-chart__legend' aria-label={legendAriaLabel ?? ariaDesc}>
          {data.map((datum, index) => (
            <li
              key={datum.x}
              className='lw-c-metrics-donut-chart__legend-item'
              style={
                {
                  '--lw-metrics-donut-swatch': colorScale[index % colorScale.length],
                } as CSSProperties
              }
            >
              {formatLegendLabel({ datum })}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default LwMetricsDonutChart;
