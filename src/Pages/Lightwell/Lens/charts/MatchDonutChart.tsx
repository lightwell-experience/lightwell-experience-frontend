import { ChartDonut, ChartLabel } from '@patternfly/react-charts/victory';
import { chart_donut_label_subtitle_Fill } from '@patternfly/react-tokens/dist/esm/chart_donut_label_subtitle_Fill';
import { chart_donut_label_title_Fill } from '@patternfly/react-tokens/dist/esm/chart_donut_label_title_Fill';
import { t_global_font_weight_heading_bold } from '@patternfly/react-tokens/dist/esm/t_global_font_weight_heading_bold';
import { useMemo, type CSSProperties, type Ref } from 'react';

import { DONUT_TITLE_AND_SUBTITLE_STYLE, DONUT_COLOR_SCALE } from './chartTheme';
import {
  COVERAGE_DONUT_PADDING,
  COVERAGE_DONUT_TITLE_LINE_HEIGHT,
  getDonutData,
  getDonutLabel,
  getMatchedPackagePercentage,
} from './matchDonutModel';
import type { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';

type MatchDonutChartBase = {
  report: CompletedCoverageReport;
  width: number;
  height: number;
};

export type MatchDonutChartWebProps = MatchDonutChartBase & {
  surface?: 'web';
  containerRef: Ref<HTMLDivElement>;
};

export type MatchDonutChartPdfProps = MatchDonutChartBase & {
  surface: 'pdf';
};

export type MatchDonutChartProps = MatchDonutChartWebProps | MatchDonutChartPdfProps;

// Same ring share as `LwMetricsDonutChart`: the band is 14% of the outer radius.
const RING_THICKNESS_RATIO = 0.14;

const getPdfInnerRadius = (width: number, height: number): number => {
  const radius =
    Math.min(
      width - COVERAGE_DONUT_PADDING.left - COVERAGE_DONUT_PADDING.right,
      height - COVERAGE_DONUT_PADDING.top - COVERAGE_DONUT_PADDING.bottom,
    ) / 2;
  return radius * (1 - RING_THICKNESS_RATIO);
};

// The PDF donut is 180px wide. The on-screen 36px / 14px pair overflows that hole.
const PDF_DONUT_TITLE_STYLE: CSSProperties[] = [
  {
    fill: chart_donut_label_title_Fill.value,
    fontSize: 20,
    fontWeight: Number(t_global_font_weight_heading_bold.value),
  },
  {
    fill: chart_donut_label_subtitle_Fill.value,
    fontSize: 10,
  },
];

const MatchDonutChart = (props: MatchDonutChartProps) => {
  const { report, width, height } = props;
  const isPdf = props.surface === 'pdf';

  const showTooltips = !isPdf;
  const containerRef = isPdf ? undefined : props.containerRef;
  const percentage = getMatchedPackagePercentage(report);
  const donutData = useMemo(() => getDonutData(report), [report]);

  const chart = (
    <ChartDonut
      ariaDesc='Match summary donut chart'
      constrainToVisibleArea
      data={donutData}
      colorScale={DONUT_COLOR_SCALE}
      allowTooltip={showTooltips}
      labels={isPdf ? () => '' : showTooltips ? getDonutLabel : undefined}
      title={`${percentage}%`}
      subTitle='packages matched'
      titleComponent={
        <ChartLabel
          lineHeight={isPdf ? 1.15 : COVERAGE_DONUT_TITLE_LINE_HEIGHT}
          style={isPdf ? PDF_DONUT_TITLE_STYLE : DONUT_TITLE_AND_SUBTITLE_STYLE}
        />
      }
      width={width}
      height={height}
      padding={COVERAGE_DONUT_PADDING}
      innerRadius={isPdf ? getPdfInnerRadius(width, height) : undefined}
    />
  );

  if (!isPdf) {
    return <div ref={containerRef}>{chart}</div>;
  }

  return chart;
};

export default MatchDonutChart;
