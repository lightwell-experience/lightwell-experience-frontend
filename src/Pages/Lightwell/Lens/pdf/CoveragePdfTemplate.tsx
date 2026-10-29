import { Content, Title } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import type { AsyncState } from '@redhat-cloud-services/types';

import type { CoverageMatchStatus } from 'services/Lightwell/CoverageReportsApi';
import { MATCH_STATUS_COLORS } from '../charts/chartTheme';
import { t_global_color_nonstatus_gray_default } from '@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_gray_default';
import { t_global_color_nonstatus_green_default } from '@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_green_default';
import { t_global_color_nonstatus_yellow_default } from '@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_yellow_default';
import { t_global_icon_color_severity_critical_default } from '@patternfly/react-tokens/dist/esm/t_global_icon_color_severity_critical_default';
import { t_global_icon_color_severity_important_default } from '@patternfly/react-tokens/dist/esm/t_global_icon_color_severity_important_default';
import { t_global_icon_color_severity_minor_default } from '@patternfly/react-tokens/dist/esm/t_global_icon_color_severity_minor_default';
import { t_global_icon_color_severity_moderate_default } from '@patternfly/react-tokens/dist/esm/t_global_icon_color_severity_moderate_default';
import MatchDonutChart from '../charts/MatchDonutChart';
import EcosystemBarChart from '../charts/EcosystemBarChart';
import { getMatchDonutChartHeight, getMatchedPackagePercentage } from '../charts/matchDonutModel';
import { getEcosystemBarChartHeight } from '../charts/ecosystemBarModel';
import {
  CVE_SEVERITIES,
  formatCvssRange,
  getTotalCveCount,
  type CveSeverity,
  type CveSeverityMeta,
} from '../utils/cveSeverity';
import type { CoveragePdfAdditionalData, CoveragePdfData } from './coveragePdf';

type CoveragePdfTemplateProps = {
  asyncData: AsyncState<CoveragePdfData>;
  additionalData?: Partial<CoveragePdfAdditionalData>;
};

const PACKAGE_COLUMNS = [
  { label: 'Package', slug: 'package' },
  { label: 'Version', slug: 'version' },
  { label: 'Ecosystem', slug: 'ecosystem' },
  { label: 'Match', slug: 'match' },
  { label: 'CVE Fixes (net delta)', slug: 'cve' },
  { label: 'CVSS Scores', slug: 'cvss' },
] as const;

// Raw severity SVG icon with inline color so it renders in the server-side PDF HTML.
const SeverityGlyph = ({ meta }: { meta: CveSeverityMeta }) => {
  const Glyph = meta.icon;
  return <Glyph style={{ color: meta.color, fontSize: '11px', verticalAlign: '-2px' }} />;
};

const MATCH_STATUS_LABEL: Record<CoverageMatchStatus, string> = {
  exact: 'Exact',
  partial: 'Partial',
  none: 'None',
};

const PILL_COLORS: Record<CoverageMatchStatus, string> = {
  exact: t_global_color_nonstatus_green_default.var,
  partial: t_global_color_nonstatus_yellow_default.var,
  none: t_global_color_nonstatus_gray_default.var,
};

const PDF_DONUT_WIDTH = 180;
const PDF_DONUT_HEIGHT = getMatchDonutChartHeight(PDF_DONUT_WIDTH);
const PDF_BAR_CHART_WIDTH = 700;

const STAT_COLORS: Record<CoverageMatchStatus, string> = {
  exact: MATCH_STATUS_COLORS.exact,
  partial: MATCH_STATUS_COLORS.partial,
  none: MATCH_STATUS_COLORS.none,
};

const CVE_BAR_COLORS: Record<CveSeverity, string> = {
  critical: t_global_icon_color_severity_critical_default.value,
  important: t_global_icon_color_severity_important_default.value,
  moderate: t_global_icon_color_severity_moderate_default.value,
  low: t_global_icon_color_severity_minor_default.value,
};

const CoveragePdfTemplate = ({ asyncData, additionalData }: CoveragePdfTemplateProps) => {
  const { data } = asyncData;
  const packages = data?.packages ?? [];
  const report = data?.report ?? null;
  const filename = additionalData?.filename;
  const generatedAt = additionalData?.generatedAt;
  const includeSummary = additionalData?.includeSummary !== false && !!report;
  // Mirror the on-screen report: hide every CVE surface when there is no data.
  const includeCveData = additionalData?.includeCveData !== false;
  const includePackages = additionalData?.includePackages !== false;
  const packageColumns = includeCveData
    ? PACKAGE_COLUMNS
    : PACKAGE_COLUMNS.filter(({ slug }) => slug !== 'cve' && slug !== 'cvss');

  return (
    <div className='coverage-pdf'>
      <style>{`
        .coverage-pdf {
          color: #151515;
          font-family: 'Red Hat Text', Helvetica, Arial, sans-serif;
          padding: 8px 0 16px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .coverage-pdf h1 { color: #151515; margin: 0 0 4px; font-size: 22px; }
        .coverage-pdf .coverage-pdf-meta { color: #6a6e73; margin: 0; font-size: 12px; }
        .coverage-pdf h2 { margin: 0 0 8px; page-break-after: avoid; }
        .coverage-pdf .coverage-pdf-cover {
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding: 8px 0;
        }
        .coverage-pdf .coverage-pdf-summary {
          display: flex;
          align-items: flex-start;
          gap: 32px;
        }
        .coverage-pdf .coverage-pdf-summary-detail {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }
        .coverage-pdf .coverage-pdf-summary-text { font-size: 16px; line-height: 1.4; }
        .coverage-pdf .coverage-pdf-summary-subtext { color: #6a6e73; font-size: 12px; }
        .coverage-pdf .coverage-pdf-metric-row {
          display: flex;
          align-items: stretch;
          flex-wrap: nowrap;
          gap: 24px;
        }
        .coverage-pdf .coverage-pdf-metric { flex: 1; min-width: 0; }
        .coverage-pdf .coverage-pdf-metric-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .coverage-pdf .coverage-pdf-metric-card {
          border: 1px solid #d2d2d2;
          border-radius: 16px;
          padding: 16px 20px;
        }
        .coverage-pdf .coverage-pdf-stats {
          display: flex;
          justify-content: space-around;
          gap: 16px;
        }
        .coverage-pdf .coverage-pdf-stat { text-align: center; }
        .coverage-pdf .coverage-pdf-stat-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
        .coverage-pdf .coverage-pdf-stat-bar {
          display: block;
          width: 2.5rem;
          height: 0.25rem;
          border-radius: 9999px;
          margin: 6px auto 0;
        }
        .coverage-pdf .coverage-pdf-stat-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 11px;
          color: #6a6e73;
          margin-top: 6px;
        }
        .coverage-pdf .coverage-pdf-ecosystem-section h2 { margin: 0 0 8px; }
        .coverage-pdf .coverage-pdf-ecosystem-subtitle { margin-bottom: 12px; }
        .coverage-pdf .coverage-pdf-ecosystem-chart { page-break-inside: avoid; }
        .coverage-pdf table,
        .coverage-pdf .pf-v6-c-table,
        .coverage-pdf .pf-v5-c-table {
          display: table;
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }
        .coverage-pdf thead { display: table-header-group; }
        .coverage-pdf tbody { display: table-row-group; }
        .coverage-pdf tr { display: table-row; page-break-inside: avoid; }
        .coverage-pdf th, .coverage-pdf td {
          display: table-cell;
          font-size: 10px;
          vertical-align: top;
        }
        .coverage-pdf th {
          background-color: #f0f0f0;
          font-weight: 700;
          padding: 8px 8px 6px;
          text-align: left;
        }
        .coverage-pdf td { padding: 6px 8px; }
        .coverage-pdf .coverage-pdf-table tbody tr:nth-child(even) td {
          background-color: #fafafa;
        }
        .coverage-pdf .coverage-pdf-col-package {
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .coverage-pdf .coverage-pdf-col-version,
        .coverage-pdf .coverage-pdf-col-ecosystem,
        .coverage-pdf .coverage-pdf-col-match,
        .coverage-pdf .coverage-pdf-col-cve,
        .coverage-pdf .coverage-pdf-col-cvss {
          width: 1%;
          white-space: nowrap;
        }
        .coverage-pdf .coverage-pdf-cve-fix { display: inline-block; margin-right: 10px; }
        .coverage-pdf .coverage-pdf-cve-fix:last-child { margin-right: 0; }
        .coverage-pdf .coverage-pdf-pill {
          display: inline-block;
          font-size: 10px;
          font-weight: 400;
          padding: 2px 8px;
          border-radius: 9999px;
          color: #151515;
        }
      `}</style>
      {includeSummary && report ? (
        <div className='coverage-pdf-cover'>
          <div>
            <Title headingLevel='h1' size='2xl'>
              Lightwell Match Analysis Report
            </Title>
            {filename || generatedAt ? (
              <Content className='coverage-pdf-meta'>
                {filename ? `Manifest: ${filename}` : null}
                {filename && generatedAt ? ' · ' : null}
                {generatedAt ? `Generated: ${generatedAt}` : null}
              </Content>
            ) : null}
          </div>
          <div className='coverage-pdf-summary'>
            <MatchDonutChart
              surface='pdf'
              report={report}
              width={PDF_DONUT_WIDTH}
              height={PDF_DONUT_HEIGHT}
            />
            <div className='coverage-pdf-summary-detail'>
              <div className='coverage-pdf-summary-text'>
                <strong>
                  {getMatchedPackagePercentage(report)}% of packages match the Lightwell Network
                  catalog
                </strong>
                <br />
                <span className='coverage-pdf-summary-subtext'>
                  Includes packages from every detected ecosystem, including ecosystems the catalog
                  does not support.
                </span>
              </div>
            </div>
          </div>
          <div className='coverage-pdf-metric-row'>
            <div className='coverage-pdf-metric'>
              <div className='coverage-pdf-metric-title'>Summary</div>
              <div className='coverage-pdf-metric-card'>
                <div className='coverage-pdf-stats'>
                  {[
                    {
                      value: report.exact_matches,
                      label: 'Exact match',
                      color: 'exact' as const,
                    },
                    {
                      value: report.partial_matches,
                      label: 'Partial match',
                      color: 'partial' as const,
                    },
                    { value: report.unmatched, label: 'No match', color: 'none' as const },
                  ].map(({ value, label, color }) => (
                    <div key={label} className='coverage-pdf-stat'>
                      <div className='coverage-pdf-stat-value'>{value}</div>
                      <span
                        className='coverage-pdf-stat-bar'
                        style={{ backgroundColor: STAT_COLORS[color] }}
                      />
                      <div className='coverage-pdf-stat-label'>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {includeCveData ? (
              <div className='coverage-pdf-metric'>
                <div className='coverage-pdf-metric-title'>Fixed CVEs</div>
                <div className='coverage-pdf-metric-card'>
                  <div className='coverage-pdf-stats'>
                    {CVE_SEVERITIES.map((meta) => (
                      <div key={meta.key} className='coverage-pdf-stat'>
                        <div className='coverage-pdf-stat-value'>
                          {report.cve_summary[meta.key]}
                        </div>
                        <span
                          className='coverage-pdf-stat-bar'
                          style={{ backgroundColor: CVE_BAR_COLORS[meta.key] }}
                        />
                        <div className='coverage-pdf-stat-label'>
                          <SeverityGlyph meta={meta} /> {meta.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className='coverage-pdf-ecosystem-section'>
            <Title headingLevel='h2' size='md'>
              Packages by ecosystem
            </Title>
            <Content component='p' className='coverage-pdf-ecosystem-subtitle'>
              <strong>{report.exact_matches + report.partial_matches}</strong> of{' '}
              <strong>{report.total}</strong> packages found in the Lightwell Network catalog.
            </Content>
            <div className='coverage-pdf-ecosystem-chart'>
              <EcosystemBarChart
                surface='pdf'
                showLegend={false}
                report={report}
                width={PDF_BAR_CHART_WIDTH}
                height={getEcosystemBarChartHeight(report.ecosystem_coverage_summary.length)}
              />
            </div>
          </div>
        </div>
      ) : null}
      {includePackages ? (
        <>
          {includeSummary && report ? (
            <Title headingLevel='h2' size='md' style={{ pageBreakBefore: 'always' }}>
              Packages
            </Title>
          ) : null}
          <Table
            variant='compact'
            className='coverage-pdf-table'
            aria-label='Coverage report packages'
            gridBreakPoint=''
          >
            <Thead>
              <Tr>
                {packageColumns.map(({ label, slug }) => (
                  <Th key={slug} className={`coverage-pdf-col-${slug}`}>
                    {label}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {packages.map((pkg) => (
                <Tr key={`${pkg.ecosystem}-${pkg.name}-${pkg.version}`}>
                  <Td dataLabel='Package' className='coverage-pdf-col-package'>
                    {pkg.name}
                  </Td>
                  <Td dataLabel='Version' className='coverage-pdf-col-version'>
                    {pkg.version || '—'}
                  </Td>
                  <Td dataLabel='Ecosystem' className='coverage-pdf-col-ecosystem'>
                    {pkg.ecosystem}
                  </Td>
                  <Td dataLabel='Match' className='coverage-pdf-col-match'>
                    <span
                      className='coverage-pdf-pill'
                      style={{ backgroundColor: PILL_COLORS[pkg.match_status] }}
                    >
                      {MATCH_STATUS_LABEL[pkg.match_status]}
                    </span>
                  </Td>
                  {includeCveData ? (
                    <>
                      <Td dataLabel='CVE Fixes (net delta)' className='coverage-pdf-col-cve'>
                        {getTotalCveCount(pkg.cve_count) === 0
                          ? '—'
                          : CVE_SEVERITIES.filter((meta) => pkg.cve_count[meta.key] > 0).map(
                              (meta) => (
                                <span key={meta.key} className='coverage-pdf-cve-fix'>
                                  <SeverityGlyph meta={meta} /> {pkg.cve_count[meta.key]}
                                </span>
                              ),
                            )}
                      </Td>
                      <Td dataLabel='CVSS Scores' className='coverage-pdf-col-cvss'>
                        {formatCvssRange(pkg.cve_range)}
                      </Td>
                    </>
                  ) : null}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </>
      ) : null}
    </div>
  );
};

export default CoveragePdfTemplate;
