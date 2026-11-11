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

// TODO(LWLP-4894, design): these reuse the Lens match-status palette as a placeholder
// from the mockup. Confirm with design, or define a Beacon status palette.
const SLICE_COLOR: Record<'onHold' | 'noRemediation' | 'inPipeline', LwMatchStatusColorKey> = {
  onHold: 'partial',
  noRemediation: 'none',
  inPipeline: 'exact',
};

export const getOnHoldCount = (statusCounts: StatusCounts): number =>
  statusCounts?.[ON_HOLD_STATUS] ?? 0;

export const getNoRemediationCount = (statusCounts: StatusCounts): number =>
  statusCounts?.[UNREMEDIATED_STATUS] ?? 0;

/**
 * Everything that is neither On Hold nor Unremediated, so the three slices always add up
 * to the Total.
 * TODO(LWLP-4894, design): this folds Upstreaming / Published into In Pipeline. Confirm.
 */
export const getInPipelineCount = (statusCounts: StatusCounts): number =>
  Object.entries(statusCounts ?? {}).reduce(
    (sum, [status, count]) =>
      status === ON_HOLD_STATUS || status === UNREMEDIATED_STATUS ? sum : sum + count,
    0,
  );

/** One text for the tooltip and the legend row: `On Hold: 3`. */
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
      { x: statusLabel(ON_HOLD_STATUS), y: getOnHoldCount(statusCounts) },
      { x: NO_REMEDIATION_LABEL, y: getNoRemediationCount(statusCounts) },
      { x: IN_PIPELINE_LABEL, y: getInPipelineCount(statusCounts) },
    ],
    colorScale: [
      matchStatus[SLICE_COLOR.onHold],
      matchStatus[SLICE_COLOR.noRemediation],
      matchStatus[SLICE_COLOR.inPipeline],
    ],
  };
};
