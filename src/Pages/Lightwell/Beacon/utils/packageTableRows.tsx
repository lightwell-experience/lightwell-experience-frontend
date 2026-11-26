import type { ReactNode } from 'react';

import { LwDataView, type LwDataViewManageColumn } from 'kit/components/assemblies';
import { LwButton, LwIcon, LwPopover, LwTitle, LwTooltip } from 'kit/components/primitives';
import { getLwDataViewDefaults } from 'kit/components/components.config';
import { lightwellConfig } from 'kit/lightwell.config';
import {
  CVE_SEVERITIES,
  renderCveSeverityIcon,
  type CveSeverity,
} from '../../Lens/utils/cveSeverity';
import { BEACON_WORKFLOW, type Severity, type Status, type Vulnerability } from '../types';
import { renderVulnerabilityCell } from './vulnerabilityTableCells';
import { SEVERITIES, severityLabel, statusLabel } from '../constants';
import { formatEcosystem } from './vulnerabilityTableColumns';
import { PublishedVersions } from '../components/PublishedVersions';
import { getPipelineStepPresentation } from '../pipeline';
import { sortVersionsDesc } from '../../Packages/utils/versions';
import { packageIdentity } from './addressedPackages';

// Sorting is off for every package column until the API can support it
// (LWLP-4495) — the vulnerabilities endpoint takes no sort parameter. No column
// sets `isSortable`, so LwDataView renders the headers unsortable.
const packageColumnDefinitions = [
  { key: 'package', cell: 'Package', props: { width: 15 as const } },
  { key: 'version', cell: 'Version' },
  { key: 'ecosystem', cell: 'Ecosystem' },
  { key: 'vulnerabilities', cell: 'Vulnerabilities' },
  { key: 'severity', cell: 'Highest severity' },
  { key: 'severityCounts', cell: 'CVEs by severity' },
  { key: 'statuses', cell: 'Statuses' },
  { key: 'publishedVersions', cell: 'Published version' },
] as const satisfies readonly Pick<LwDataViewManageColumn, 'key' | 'cell' | 'props'>[];

type PackageColumnKey = (typeof packageColumnDefinitions)[number]['key'];

export const PACKAGE_COLUMNS = packageColumnDefinitions.map((column) => ({
  ...column,
  isShown: true,
  isShownByDefault: true,
}));

export function createDefaultPackageColumns() {
  return PACKAGE_COLUMNS.map((column) => ({ ...column }));
}

const PACKAGE_STATUS_ORDER = [
  ...BEACON_WORKFLOW.statuses,
  BEACON_WORKFLOW.onHold,
  BEACON_WORKFLOW.unremediated,
];

/**
 * Beacon severity → the CVE bucket it counts into. Beacon's `Minor` is the
 * backend's `low` bucket. Keyed on both types so renaming a severity or a
 * bucket is a compile error rather than a bucket that silently reads zero.
 */
const CVE_SEVERITY_KEY: Record<Severity, CveSeverity> = {
  Critical: 'critical',
  Important: 'important',
  Moderate: 'moderate',
  Minor: 'low',
};

/** The pipeline stage's icon in its stage color. Decorative — the caller names
 * the status on the element around it. */
function statusIcon(status: Status) {
  const presentation = getPipelineStepPresentation(status);
  return (
    <LwIcon
      size='sm'
      aria-hidden='true'
      style={{ color: lightwellConfig.colors.stepIcon[presentation.color] }}
    >
      {presentation.icon}
    </LwIcon>
  );
}

/** Beacon severity → the shared CVE severity icon, in its severity color. */
function severityIcon(severity: Severity) {
  const meta = CVE_SEVERITIES.find(({ key }) => key === CVE_SEVERITY_KEY[severity]);
  return meta ? renderCveSeverityIcon(meta) : null;
}

/** An icon standing in for a text cell. The tooltip and the accessible name
 * carry the label, so the column can be as narrow as the glyph; `tabIndex`
 * keeps the tooltip reachable without a pointer. */
function iconCell(label: string, icon: ReactNode, className?: string) {
  return (
    <LwTooltip content={label} position='top'>
      <span className={className} aria-label={label} tabIndex={0}>
        {icon}
      </span>
    </LwTooltip>
  );
}

/**
 * Status and severity read as icons alone — in a list sorted by status, those
 * two columns would otherwise spend width on labels that repeat down the page.
 *
 * A status carrying a resolution reason (only On Hold and No remediation ever
 * do) becomes a link-styled trigger and the reason opens in a popover. That
 * keeps the column icon-narrow while still marking, at a glance, which rows
 * have something more to say. The dashed blue rule is drawn on the inner span
 * rather than the button — see `beacon-package-status-reason` for why. The
 * popover's own header names the status, so the trigger drops the tooltip
 * rather than stacking two overlays on one target.
 */
function renderDetailCell(columnKey: string, v: Vulnerability) {
  if (columnKey === 'severity') {
    return iconCell(severityLabel(v.severity), severityIcon(v.severity));
  }
  if (columnKey === 'status') {
    const label = statusLabel(v.status);
    // Both forms wear `beacon-package-status-icon`, so the glyphs stay in one
    // column whether or not the row has a reason — the underline needs room
    // either side of the icon, and an unpadded one would sit left of the rest.
    if (!v.resolutionReason) {
      return iconCell(label, statusIcon(v.status), 'beacon-package-status-icon');
    }
    return (
      <LwPopover
        hasHeader={label}
        hasBody={v.resolutionReason}
        hasTrigger={
          <LwButton variant='link' isInline aria-label={label}>
            <span className='beacon-package-status-icon beacon-package-status-reason'>
              {statusIcon(v.status)}
            </span>
          </LwButton>
        }
      />
    );
  }
  return renderVulnerabilityCell(columnKey, v);
}

// One flat list, so every column applies to every row: `status` carries the
// resolution reason under its icon, which is what the per-status `Reason`
// column and the reason-under-title used to do, and `publishedVersions` is a
// plain column instead of a Lightwell Network extra.
const DETAIL_COLUMNS = [
  { key: 'vulnerabilityId', cell: 'Vulnerability ID' },
  { key: 'title', cell: 'Title', props: { width: 40 as const } },
  { key: 'status', cell: 'Status' },
  { key: 'severity', cell: 'Severity' },
  { key: 'cvss', cell: 'CVSS' },
  { key: 'publishedVersions', cell: 'Published versions' },
  { key: 'lastUpdated', cell: 'Last updated' },
];

const PACKAGE_VULNERABILITIES_PER_PAGE = getLwDataViewDefaults().defaultPerPage ?? 10;

/** Whether any CVE on the package names a published (fixed) version. Stated
 * once: the drawer drops both the summary term and the table column when it's
 * false, and the two must agree. */
const groupHasPublishedVersion = (group: Vulnerability[]) =>
  group.some(({ publishedVersions }) => publishedVersions.length > 0);

/**
 * Every CVE on the package as one paginated list in pipeline order, rather than
 * a stack of per-status tables each paging on its own. Sorting is fixed, not
 * user-driven: the order is the pipeline, same as the stepper reads.
 */
export function PackageDetails({ group }: { group: Vulnerability[] }) {
  const vulnerabilities = [...group].sort(
    (a, b) => PACKAGE_STATUS_ORDER.indexOf(a.status) - PACKAGE_STATUS_ORDER.indexOf(b.status),
  );
  // No fixed release anywhere on the package means the column would be empty
  // down every row — drop it, as the summary drops the matching term.
  const columns = groupHasPublishedVersion(group)
    ? DETAIL_COLUMNS
    : DETAIL_COLUMNS.filter(({ key }) => key !== 'publishedVersions');
  return (
    <>
      <LwTitle headingLevel='h3' size='lg' className='beacon-package-details-heading'>
        Vulnerabilities ({vulnerabilities.length})
      </LwTitle>
      <LwDataView
        wrapperClassName='beacon-package-status-table'
        isCardless
        isCompact
        isResident
        pagination={
          vulnerabilities.length > PACKAGE_VULNERABILITIES_PER_PAGE
            ? { widgetId: 'beacon-package-vulnerabilities' }
            : undefined
        }
        showBottomPagination={false}
        aria-label={`Vulnerabilities for ${group[0].componentName} ${group[0].componentVersion}`}
        columns={columns}
        rows={vulnerabilities.map((v) => ({
          id: v.uuid,
          row: columns.map((column) => ({
            cell: renderDetailCell(column.key, v),
            props: { dataLabel: column.cell, modifier: 'breakWord' as const },
          })),
        }))}
      />
    </>
  );
}

/**
 * Group the full filtered result, never a single API page. Returns the summary
 * cell per column key — which of them is visible, and how a cell becomes a `<Td>`,
 * is the table's business, so the caller assembles the row from `summary`.
 */
export function buildPackageRows(vulnerabilities: Vulnerability[]) {
  const packages = new Map<string, Vulnerability[]>();
  for (const vulnerability of vulnerabilities) {
    // Ecosystem separates identically named packages in different registries;
    // componentName retains scoped names, unlike parsing a display label.
    const key = packageIdentity(vulnerability);
    const group = packages.get(key) ?? [];
    group.push(vulnerability);
    packages.set(key, group);
  }

  return [...packages].map(([id, group]) => {
    const first = group[0];
    // A CVE reported more than once counts once, at its highest reported severity.
    const cveSeverities = new Map<string, Severity>();
    for (const vulnerability of group) {
      const previous = cveSeverities.get(vulnerability.vulnerabilityId);
      if (
        previous === undefined ||
        SEVERITIES.indexOf(vulnerability.severity) < SEVERITIES.indexOf(previous)
      ) {
        cveSeverities.set(vulnerability.vulnerabilityId, vulnerability.severity);
      }
    }
    const severityCounts = new Map<CveSeverity, number>();
    for (const value of cveSeverities.values()) {
      const key = CVE_SEVERITY_KEY[value];
      severityCounts.set(key, (severityCounts.get(key) ?? 0) + 1);
    }
    const severity = SEVERITIES.find((value) => severityCounts.has(CVE_SEVERITY_KEY[value]));

    const versions = [...new Set(group.flatMap((v) => v.publishedVersions))];
    // Summary rows aggregate every CVE in the group, so the full list would
    // dominate the row — show the highest version only. Per-vulnerability cells
    // (vulnerability table, package drawer) keep the whole list
    // behind `PublishedVersions`' overflow popover.
    const highestVersion = sortVersionsDesc(versions).slice(0, 1);
    const cells = {
      package: first.componentName,
      version: first.componentVersion || '—',
      ecosystem: formatEcosystem(first.ecosystem),
      vulnerabilities: cveSeverities.size,
      severity: severity ? severityLabel(severity) : '—',
      severityCounts: (
        <span key='severityCounts' className='beacon-package-counts'>
          {CVE_SEVERITIES.map((meta) => {
            const count = severityCounts.get(meta.key) ?? 0;
            return (
              <LwTooltip key={meta.key} content={meta.label} position='top'>
                <span
                  className='beacon-package-counts__item'
                  aria-label={`${meta.label}: ${count}`}
                  tabIndex={0}
                >
                  {renderCveSeverityIcon(meta)}
                  <span>{count}</span>
                </span>
              </LwTooltip>
            );
          })}
        </span>
      ),
      statuses: (
        <span key='statuses' className='beacon-package-counts'>
          {PACKAGE_STATUS_ORDER.map((status) => {
            const count = new Set(
              group.filter((v) => v.status === status).map((v) => v.vulnerabilityId),
            ).size;
            if (!count) return null;
            const presentation = getPipelineStepPresentation(status);
            return (
              <LwTooltip key={status} content={statusLabel(status)} position='top'>
                <span
                  className='beacon-package-counts__item'
                  aria-label={`${statusLabel(status)}: ${count}`}
                  tabIndex={0}
                >
                  <LwIcon
                    size='sm'
                    aria-hidden='true'
                    style={{ color: lightwellConfig.colors.stepIcon[presentation.color] }}
                  >
                    {presentation.icon}
                  </LwIcon>
                  <span>{count}</span>
                </span>
              </LwTooltip>
            );
          })}
        </span>
      ),
      publishedVersions: <PublishedVersions versions={highestVersion} />,
    } satisfies Record<PackageColumnKey, React.ReactNode>;
    // `summary.publishedVersions` is an element that renders nothing when the
    // list is empty, so it can't be tested for emptiness — the drawer uses this
    // to decide whether the term is worth a row at all.
    return {
      id,
      group,
      summary: cells,
      severity,
      hasPublishedVersion: groupHasPublishedVersion(group),
    };
  });
}
