import type { ReactNode } from 'react';

import BundleIcon from '@patternfly/react-icons/dist/esm/icons/bundle-icon';
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import OutlinedHourglassIcon from '@patternfly/react-icons/dist/esm/icons/outlined-hourglass-icon';
import RhUiInProgressIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-in-progress-icon';
import RhUiPendingIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-pending-icon';

import type { LwMetricsStep } from 'kit/components/assemblies';
import type { LwStepIconColorKey } from 'kit/lightwell.config';

import { STATUSES, STATUS_DESCRIPTIONS, statusLabel } from './constants';
import type { Status } from './types';

type PipelineStatus = Exclude<Status, 'Upstreaming' | 'Published' | 'Unremediated' | 'On Hold'>;

type PipelineStepPresentation = {
  color: LwStepIconColorKey;
  icon: ReactNode;
};

/** Same icon and step color the Beacon page passes to `LwMetricsStepper`. */
export const PIPELINE_STEP_PRESENTATION: Record<PipelineStatus, PipelineStepPresentation> = {
  Submitted: { color: 'blue', icon: <RhUiPendingIcon /> },
  Classified: { color: 'exact', icon: <CheckCircleIcon /> },
  'Fix in Progress': { color: 'orange', icon: <RhUiInProgressIcon /> },
  Validation: { color: 'purple', icon: <OutlinedHourglassIcon /> },
  'Lightwell Network': { color: 'teal', icon: <BundleIcon /> },
};

export function getPipelineStepPresentation(status: Status): PipelineStepPresentation | undefined {
  return PIPELINE_STEP_PRESENTATION[status as PipelineStatus];
}

export function buildPipelineMetricSteps(
  statusCounts: Record<string, number> | undefined,
  isHydrated: boolean,
): LwMetricsStep[] {
  return STATUSES.map((status) => {
    const count = statusCounts?.[status] ?? 0;
    const presentation = PIPELINE_STEP_PRESENTATION[status as PipelineStatus];

    return {
      id: status,
      label: statusLabel(status),
      tooltip: STATUS_DESCRIPTIONS[status],
      value: isHydrated ? count : undefined,
      icon: presentation.icon,
      variant: isHydrated && count === 0 ? 'pending' : undefined,
      color: isHydrated ? presentation.color : undefined,
    };
  });
}
