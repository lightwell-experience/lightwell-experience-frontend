import type { LwVulnerabilitySeverity } from 'kit/lightwell.config';

/** Vulnerability severity — see `lightwellConfig.vulnerabilitySeverity.scale`. */
export type Severity = LwVulnerabilitySeverity;

/**
 * Beacon workflow statuses — Beacon-only domain data, not shared with other
 * Lightwell pages, so it lives in Beacon's own domain wiring rather than the
 * tenant-root kit config.
 *
 * - `statuses` — exhaustive set of all valid pipeline stages; used to derive the
 *   `Status` type and `STATUS_DESCRIPTIONS` lookup.
 * - `pipelineStages` — ordered subset shown in the UI stepper and filter panel.
 *   Upstreaming and Published are valid statuses a vulnerability can hold, but the
 *   stepper/filter only surfaces the active Lightwell-managed stages.
 * - `unremediated` — non-pipeline terminal state (closed without a fix).
 * - `onHold` — non-pipeline paused state.
 */
export const BEACON_WORKFLOW = {
  /** All valid pipeline stages (exhaustive — drives Status type + description lookup). */
  statuses: [
    'Submitted',
    'Classified',
    'Fix in Progress',
    'Validation',
    'Lightwell Network',
    'Upstreaming',
    'Published',
  ] as const,
  /** Stages displayed in the pipeline stepper and filter panel. */
  pipelineStages: [
    'Submitted',
    'Classified',
    'Fix in Progress',
    'Validation',
    'Lightwell Network',
  ] as const,
  /** Non-pipeline terminal status — vulnerability closed without a shipped fix. */
  unremediated: 'Unremediated' as const,
  /** Non-pipeline paused status — vulnerability work is on hold. */
  onHold: 'On Hold' as const,
};

/** Beacon workflow status union — all pipeline statuses plus `'On Hold'` and `'Unremediated'`. */
export type Status =
  | (typeof BEACON_WORKFLOW.statuses)[number]
  | typeof BEACON_WORKFLOW.unremediated
  | typeof BEACON_WORKFLOW.onHold;

export type CustomerPriority = 'Priority 1' | 'Priority 2' | 'Priority 3' | 'Priority 4';

export interface Vulnerability {
  uuid: string;
  vulnerabilityId: string;
  purl: string;
  componentName: string;
  componentVersion: string;
  publishedVersions: string[];
  title: string;
  cwe: string;
  description: string;
  severity: Severity;
  cvss: number;
  cvssVector?: string;
  exploitTested: boolean;
  reproducerIncluded: boolean;
  customerPriority?: CustomerPriority;
  status: Status;
  resolutionReason?: string;
  ecosystem: string;
  submittedDate: string;
  lastUpdated: string;
  ageDays: number;
  duplicate: boolean;
  duplicateOf?: string;
  ltwlsupt_ticket_id?: string;
  ltwlsupt_ticket_ids?: string[];
}
