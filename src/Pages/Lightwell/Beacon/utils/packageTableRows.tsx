import {
  LwDataView,
  type LwDataViewManageColumn,
  type LwDataViewTd,
} from 'kit/components/assemblies';
import { LwIcon, LwTitle, LwTooltip } from 'kit/components/primitives';
import { lightwellConfig } from 'kit/lightwell.config';
import {
  CVE_SEVERITIES,
  renderCveSeverityIcon,
  type CveSeverity,
} from '../../Lens/utils/cveSeverity';
import { BEACON_WORKFLOW, type Severity, type Vulnerability } from '../types';
import { renderVulnerabilityCell } from './vulnerabilityTableCells';
import { SEVERITIES, severityLabel, statusLabel } from '../constants';
import { formatEcosystem, getVulnerabilityColumnValue } from './vulnerabilityTableColumns';
import { PublishedVersions } from '../components/PublishedVersions';
import { getPipelineStepPresentation } from '../pipeline';
import { sortVersionsDesc } from '../../Packages/utils/versions';
import { packageIdentity } from './addressedPackages';

// Sorting is intentionally off for every package column — same stance as the
// vulnerability view (D27): no sort affordance until API-driven sort lands
// (LWLP-4495), rather than a client-only sort that can't survive the backend
// APIs this POC still needs. No column sets `isSortable`, so LwDataView renders
// the headers unsortable.
export const PACKAGE_COLUMNS: LwDataViewManageColumn[] = [
  { key: 'package', cell: 'Package', props: { width: 15 as const } },
  { key: 'version', cell: 'Version' },
  { key: 'ecosystem', cell: 'Ecosystem' },
  { key: 'vulnerabilities', cell: 'Vulnerabilities' },
  { key: 'severity', cell: 'Highest severity' },
  { key: 'severityCounts', cell: 'CVEs by severity' },
  { key: 'statuses', cell: 'Statuses' },
  { key: 'publishedVersions', cell: 'Published version' },
].map((column) => ({
  ...column,
  isShown: true,
  isShownByDefault: true,
}));

export function createDefaultPackageColumns(): LwDataViewManageColumn[] {
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

const DETAIL_COLUMNS = [
  { key: 'vulnerabilityId', cell: 'Vulnerability ID' },
  { key: 'title', cell: 'Title', props: { width: 40 as const } },
  { key: 'severity', cell: 'Severity' },
  { key: 'cvss', cell: 'CVSS' },
  { key: 'lastUpdated', cell: 'Last updated' },
  { key: 'publishedVersions', cell: 'Published versions' },
];

/**
 * `hasStatusReason` groups (On Hold, No remediation) carry the reason in its own
 * column; every other group appends it under the title. Either way the section
 * heading already names the status, so the reason is shown on its own rather
 * than through `renderVulnerabilityCell('status')`, which repeats the label.
 */
function renderDetailCell(columnKey: string, v: Vulnerability, hasStatusReason: boolean) {
  if (columnKey === 'title') {
    return (
      <>
        <LwTooltip content={v.title}>
          <span className='beacon-package-vulnerability-title'>{v.title}</span>
        </LwTooltip>
        {!hasStatusReason && v.resolutionReason && <p>{v.resolutionReason}</p>}
      </>
    );
  }
  if (columnKey === 'resolutionReason') return v.resolutionReason ?? '—';
  return renderVulnerabilityCell(columnKey, v);
}

function getDetailSortValue(columnKey: string, v: Vulnerability): string | number {
  switch (columnKey) {
    case 'severity':
      return SEVERITIES.indexOf(v.severity);
    case 'cvss':
      return v.cvss;
    case 'resolutionReason':
      return v.resolutionReason ?? '';
    default:
      return getVulnerabilityColumnValue(columnKey, v);
  }
}

/**
 * A component, not a `render*` helper: `buildPackageRows` groups every package
 * in the filtered result, but only the packages on the current page are ever
 * rendered. As an element the detail tree costs one object per package and is
 * built by React when the row renders, instead of eagerly for all of them.
 */
function PackageDetails({ group }: { group: Vulnerability[] }) {
  return (
    <div className='beacon-package-details'>
      {PACKAGE_STATUS_ORDER.map((status) => {
        const vulnerabilities = group.filter((v) => v.status === status);
        if (!vulnerabilities.length) return null;
        const presentation = getPipelineStepPresentation(status);
        const hasStatusReason =
          status === BEACON_WORKFLOW.onHold || status === BEACON_WORKFLOW.unremediated;
        const columns = hasStatusReason
          ? DETAIL_COLUMNS.map((column) => {
              if (column.key === 'publishedVersions') {
                return { key: 'resolutionReason', cell: 'Reason', props: { width: 25 as const } };
              }
              return column.key === 'title' ? { ...column, props: { width: 30 as const } } : column;
            })
          : DETAIL_COLUMNS;
        return (
          <section key={status} aria-label={`${statusLabel(status)} vulnerabilities`}>
            <LwTitle headingLevel='h3' size='md' className='beacon-package-status-heading'>
              <LwIcon
                size='sm'
                aria-hidden='true'
                style={{ color: lightwellConfig.colors.stepIcon[presentation.color] }}
              >
                {presentation.icon}
              </LwIcon>
              {statusLabel(status)} ({vulnerabilities.length})
            </LwTitle>
            <LwDataView
              isCardless
              isCompact
              className='beacon-package-details-table'
              aria-label={`${statusLabel(status)} vulnerabilities for ${group[0].componentName} ${group[0].componentVersion}`}
              columns={columns}
              rows={vulnerabilities.map((v) => ({
                id: v.uuid,
                row: columns.map((column) => ({
                  cell: renderDetailCell(column.key, v, hasStatusReason),
                  props: {
                    dataLabel: column.cell,
                    modifier: 'breakWord' as const,
                    sortValue: getDetailSortValue(column.key, v),
                  },
                })),
              }))}
            />
          </section>
        );
      })}
    </div>
  );
}

/**
 * Attach a `dataLabel` to a cell without disturbing its content. The object-form
 * cell (`{ cell, props }`) keeps its existing props (e.g. `sortValue`); a bare
 * value is wrapped so the stacked/mobile layout still gets the column label.
 */
function withDataLabel(value: LwDataViewTd, dataLabel: string): LwDataViewTd {
  if (value != null && typeof value === 'object' && 'cell' in value) {
    return { ...value, props: { ...value.props, dataLabel } };
  }
  return { cell: value, props: { dataLabel } };
}

/** Group the full filtered result, never a single API page. */
export function buildPackageRows(
  vulnerabilities: Vulnerability[],
  columns: LwDataViewManageColumn[] = PACKAGE_COLUMNS,
): { id: string; row: LwDataViewTd[]; expandedContent: React.ReactNode }[] {
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
    // (vulnerability table, expanded package details) keep the whole list
    // behind `PublishedVersions`' overflow popover.
    const highestVersion = sortVersionsDesc(versions).slice(0, 1);
    const cells: Record<string, LwDataViewTd> = {
      package: first.componentName,
      version: first.componentVersion || '—',
      ecosystem: formatEcosystem(first.ecosystem),
      vulnerabilities: cveSeverities.size,
      severity: {
        cell: severity ? severityLabel(severity) : '—',
        props: { sortValue: severity ? SEVERITIES.indexOf(severity) : SEVERITIES.length },
      },
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
      publishedVersions: {
        cell: <PublishedVersions versions={highestVersion} />,
        // Sort on the version actually shown — ordering by the full joined list
        // would order the column by a string the user can't see.
        props: { sortValue: highestVersion[0] ?? '' },
      },
    };
    return {
      id,
      expandedContent: <PackageDetails group={group} />,
      // `dataLabel` is the column name PF shows before each cell in the stacked
      // (mobile/narrow) layout — attach the header to every cell so the package
      // view reads correctly there, same as the vulnerability view.
      row: columns
        .filter((column) => column.isShown)
        .map((column) => withDataLabel(cells[column.key], String(column.cell))),
    };
  });
}
