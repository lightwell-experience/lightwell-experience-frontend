import { lightwellConfig } from 'kit/lightwell.config';
import { BEACON_WORKFLOW, type Severity, type Status } from './types';

/**
 * Pipeline stages shown in the stepper and filter panel.
 * Derived from `BEACON_WORKFLOW.pipelineStages` — the subset of all statuses
 * that the Lightwell team actively manages in the UI.
 */
export const STATUSES: Status[] = [...BEACON_WORKFLOW.pipelineStages];

export const UNREMEDIATED_STATUS: Status = BEACON_WORKFLOW.unremediated;
export const NO_REMEDIATION_LABEL = 'No remediation';

export const ON_HOLD_STATUS: Status = BEACON_WORKFLOW.onHold;

/** All filter-panel statuses: pipeline stages + the on-hold and unremediated terminal states. */
export const FILTER_STATUSES: Status[] = [...STATUSES, ON_HOLD_STATUS, UNREMEDIATED_STATUS];

export function statusLabel(status: Status): string {
  switch (status) {
    case UNREMEDIATED_STATUS:
      return NO_REMEDIATION_LABEL;
    case 'Fix in Progress':
      return 'Fix in progress';
    case 'Validation':
      return 'Validating';
    case 'Lightwell Network':
      return 'Available in Lightwell Network';
    default:
      return status;
  }
}

export function severityLabel(severity: Severity): string {
  return severity === 'Minor' ? 'Low' : severity;
}

export const STATUS_DESCRIPTIONS: Record<Status, string> = {
  Submitted:
    'The submitted vulnerability is undergoing an initial review to classify a target fix.',
  Classified: 'Target fix identified.',
  'Fix in Progress': 'A fix is currently under development.',
  Validation: 'The fix is being validated within the Red Hat pipeline.',
  'Lightwell Network': 'The fix is available in the Lightwell Repository.',
  'On Hold': 'The vulnerability is on hold.',
  Upstreaming: 'The fix is being shared with the upstream community.',
  Published: 'The fix is available in upstream repos.',
  Unremediated: 'The vulnerability was closed without a shipped fix.',
};

/** Severity levels ordered most to least severe — derived from `lightwellConfig.vulnerabilitySeverity.scale`. */
export const SEVERITIES: Severity[] = [...lightwellConfig.vulnerabilitySeverity.scale];

export const SLA_POLICY_HEADER = 'Service Level Agreement policy';
