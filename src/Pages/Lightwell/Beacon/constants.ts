import { lightwellConfig } from 'kit/lightwell.config';
import { BEACON_WORKFLOW, type Severity, type Status, type Vulnerability } from './types';

/**
 * Pipeline stages shown in the stepper and filter panel.
 * Derived from `BEACON_WORKFLOW.pipelineStages` — the subset of all statuses
 * that the Lightwell team actively manages in the UI.
 */
export const STATUSES: Status[] = [...BEACON_WORKFLOW.pipelineStages];

export const UNREMEDIATED_STATUS: Status = BEACON_WORKFLOW.unremediated;
export const NO_REMEDIATION_LABEL = 'No remediation';
export const DUPLICATE_STATUS_LABEL = 'Duplicate';

export const ON_HOLD_STATUS: Status = BEACON_WORKFLOW.onHold;

/** All filter-panel statuses: pipeline stages + the on-hold and unremediated terminal states. */
export const FILTER_STATUSES: Status[] = [...STATUSES, ON_HOLD_STATUS, UNREMEDIATED_STATUS];

export function statusLabel(status: string): string {
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

export function vulnerabilityStatusLabel(
  vulnerability: Pick<Vulnerability, 'status' | 'duplicate'>,
): string {
  return vulnerability.duplicate ? DUPLICATE_STATUS_LABEL : statusLabel(vulnerability.status);
}

/**
 * On Hold reasons joined in API order, or the closure reason for any other status.
 * A row with nothing to show returns undefined.
 */
export function statusReason(
  vulnerability: Pick<Vulnerability, 'status' | 'onHoldReasons' | 'resolutionReason'>,
): string | undefined {
  if (vulnerability.status === ON_HOLD_STATUS) {
    return vulnerability.onHoldReasons?.join(', ') || undefined;
  }

  return vulnerability.resolutionReason;
}

export function severityLabel(severity: Severity): string {
  return severity === 'Minor' ? 'Low' : severity;
}

type DuplicateTracking = Pick<Vulnerability, 'duplicateOf' | 'duplicateOfStatus'>;

/** Customer-facing link to the canonical tracker, e.g. `Tracking under LTWL-5717 [Submitted]`. */
export function duplicateTrackingLabel(vulnerability: DuplicateTracking): string | undefined {
  const key = vulnerability.duplicateOf?.trim();
  if (!key) {
    return undefined;
  }
  const status = vulnerability.duplicateOfStatus?.trim();
  return status ? `Tracking under ${key} [${statusLabel(status)}]` : `Tracking under ${key}`;
}

/**
 * Status-cell detail. A duplicate's own label is already Duplicate, so only the tracker line
 * is added. Every other row uses statusReason().
 */
export function statusDetail(
  vulnerability: Pick<
    Vulnerability,
    'status' | 'duplicate' | 'onHoldReasons' | 'resolutionReason'
  > &
    DuplicateTracking,
): string | undefined {
  return (
    duplicateTrackingLabel(vulnerability) ??
    (vulnerability.duplicate ? undefined : statusReason(vulnerability))
  );
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
