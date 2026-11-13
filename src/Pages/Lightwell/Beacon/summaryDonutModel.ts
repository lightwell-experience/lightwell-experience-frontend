import type { LwMetricsDonutDatum } from 'kit/components/assemblies';
import { lightwellConfig, type LwMatchStatusColorKey } from 'kit/lightwell.config';

import {
  NO_REMEDIATION_LABEL,
  ON_HOLD_STATUS,
  UNREMEDIATED_STATUS,
  statusLabel,
} from './constants';

export const IN_PIPELINE_LABEL = 'In Pipeline';

type StatusCounts = Record<string, number> | undefined;

// Colors follow the approved design mockup. They reuse the Lens match-status palette on
// purpose; design accepts the difference from what those colors mean in Lens.
const SLICE_COLOR: Record<'onHold' | 'noRemediation' | 'inPipeline', LwMatchStatusColorKey> = {
  onHold: 'partial',
  noRemediation: 'none',
  inPipeline: 'exact',
};

/**
 * Everything that is neither On Hold nor Unremediated, so the three slices always add up
 * to the Total.
 * TODO(LWLP-4894, Matej): Upstreaming / Published are folded into In Pipeline for now.
 * Open product question: do they join the pipeline (and does Lightwell Network get
 * replaced or renamed, e.g. "pre-disclose")? Revisit once that is decided.
 */
export const getInPipelineCount = (statusCounts: StatusCounts): number =>
  Object.entries(statusCounts ?? {}).reduce(
    (sum, [status, count]) =>
      status === ON_HOLD_STATUS || status === UNREMEDIATED_STATUS ? sum : sum + count,
    0,
  );

/**
 * Tooltip text: `On Hold: 3`. The kit has no default tooltip text, so Beacon passes this as
 * `getLabel`. It matches the kit's default legend row text, which Beacon does not override.
 */
export const formatSummarySlice = ({ datum }: { datum: LwMetricsDonutDatum }): string =>
  `${datum.x}: ${datum.y}`;

export type BeaconSummaryDonutModel = {
  data: LwMetricsDonutDatum[];
  colorScale: string[];
};

export const getBeaconSummaryDonutModel = (statusCounts: StatusCounts): BeaconSummaryDonutModel => {
  const { matchStatus } = lightwellConfig.colors;

  return {
    data: [
      { x: statusLabel(ON_HOLD_STATUS), y: statusCounts?.[ON_HOLD_STATUS] ?? 0 },
      { x: NO_REMEDIATION_LABEL, y: statusCounts?.[UNREMEDIATED_STATUS] ?? 0 },
      { x: IN_PIPELINE_LABEL, y: getInPipelineCount(statusCounts) },
    ],
    colorScale: [
      matchStatus[SLICE_COLOR.onHold],
      matchStatus[SLICE_COLOR.noRemediation],
      matchStatus[SLICE_COLOR.inPipeline],
    ],
  };
};
