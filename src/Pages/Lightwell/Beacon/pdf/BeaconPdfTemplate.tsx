import { Content, Title } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import type { AsyncState } from '@redhat-cloud-services/types';
import { t_global_border_color_nonstatus_blue_default } from '@patternfly/react-tokens/dist/esm/t_global_border_color_nonstatus_blue_default';
import { t_global_border_color_nonstatus_gray_default } from '@patternfly/react-tokens/dist/esm/t_global_border_color_nonstatus_gray_default';
import { t_global_border_color_nonstatus_green_default } from '@patternfly/react-tokens/dist/esm/t_global_border_color_nonstatus_green_default';
import { t_global_border_color_nonstatus_orange_default } from '@patternfly/react-tokens/dist/esm/t_global_border_color_nonstatus_orange_default';
import { t_global_border_color_nonstatus_purple_default } from '@patternfly/react-tokens/dist/esm/t_global_border_color_nonstatus_purple_default';
import { t_global_border_color_nonstatus_teal_default } from '@patternfly/react-tokens/dist/esm/t_global_border_color_nonstatus_teal_default';
import { t_global_color_status_danger_default } from '@patternfly/react-tokens/dist/esm/t_global_color_status_danger_default';

import type { LwStepIconColorKey } from 'kit/lightwell.config';

import {
  NO_REMEDIATION_LABEL,
  ON_HOLD_STATUS,
  STATUSES,
  statusLabel,
  UNREMEDIATED_STATUS,
} from '../constants';
import { getPipelineStepPresentation } from '../pipeline';
import type { BeaconPdfAdditionalData, BeaconPdfColumn, BeaconPdfData } from './beaconPdf';
import {
  createDefaultVulnerabilityColumns,
  getVulnerabilityColumnValue,
  getVisibleVulnerabilityColumns,
} from '../utils/vulnerabilityTableColumns';

/** Print-safe fills for `lightwellConfig.colors.stepIcon`. PDF HTML may not load the theme sheet. */
const PDF_STEP_FILL: Partial<Record<LwStepIconColorKey, string>> = {
  blue: t_global_border_color_nonstatus_blue_default.value,
  exact: t_global_border_color_nonstatus_green_default.value,
  none: t_global_border_color_nonstatus_gray_default.value,
  orange: t_global_border_color_nonstatus_orange_default.value,
  purple: t_global_border_color_nonstatus_purple_default.value,
  teal: t_global_border_color_nonstatus_teal_default.value,
  red: t_global_color_status_danger_default.value,
};

const DEFAULT_COUNT_FILL = PDF_STEP_FILL.blue ?? '#004d99';

type BeaconPdfTemplateProps = {
  asyncData: AsyncState<BeaconPdfData>;
  additionalData?: Partial<BeaconPdfAdditionalData>;
};

const defaultColumns: BeaconPdfColumn[] = getVisibleVulnerabilityColumns(
  createDefaultVulnerabilityColumns(),
);

const BeaconPdfTemplate = ({ asyncData, additionalData }: BeaconPdfTemplateProps) => {
  const { data } = asyncData;
  const vulnerabilities = data?.vulnerabilities ?? [];
  const meta = data?.meta;
  const columns = additionalData?.visibleColumns?.length
    ? additionalData.visibleColumns
    : defaultColumns;
  const includeSummary = additionalData?.includeSummary !== false;
  const landscape = additionalData?.landscape === true;
  const isFiltered = additionalData?.isFiltered === true;
  const lastUpdated = additionalData?.lastUpdated;
  const statusCounts = meta?.statusCounts ?? {};
  // LwMetricsCount paints a blue bar when `color` is omitted. Critical overrides to red.
  const summaryMetrics = [
    { label: 'Total', value: meta?.count ?? vulnerabilities.length, fill: DEFAULT_COUNT_FILL },
    {
      label: 'Critical',
      value: meta?.criticalCount ?? 0,
      fill: PDF_STEP_FILL.red ?? DEFAULT_COUNT_FILL,
    },
    {
      label: ON_HOLD_STATUS,
      value: statusCounts[ON_HOLD_STATUS] ?? 0,
      fill: PDF_STEP_FILL.none ?? DEFAULT_COUNT_FILL,
    },
    {
      label: NO_REMEDIATION_LABEL,
      value: statusCounts[UNREMEDIATED_STATUS] ?? 0,
      fill: DEFAULT_COUNT_FILL,
    },
  ];

  return (
    <div className={`beacon-pdf ${landscape ? 'beacon-pdf--landscape' : 'beacon-pdf--portrait'}`}>
      <style>{`
        .beacon-pdf {
          color: #151515;
          font-family: 'Red Hat Text', Helvetica, Arial, sans-serif;
          padding: 8px 0 16px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .beacon-pdf h1 { color: #151515; margin: 0 0 4px; font-size: 28px; }
        .beacon-pdf h2 { margin: 0 0 12px; page-break-after: avoid; }
        .beacon-pdf .beacon-pdf-description { margin: 0; }
        .beacon-pdf .beacon-pdf-overview {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 24px;
          margin: 0 0 8px;
          page-break-inside: avoid;
        }
        .beacon-pdf .beacon-pdf-summary {
          border: 1px solid #d2d2d2;
          border-radius: 16px;
          padding: 16px 20px;
        }
        .beacon-pdf .beacon-pdf-summary-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
        .beacon-pdf .beacon-pdf-stats {
          display: flex;
          justify-content: space-around;
          gap: 24px;
        }
        .beacon-pdf .beacon-pdf-stat { text-align: center; }
        .beacon-pdf .beacon-pdf-stat-value { font-size: 24px; font-weight: 700; line-height: 1.2; }
        .beacon-pdf .beacon-pdf-stat-bar {
          display: block;
          width: 2.5rem;
          height: 0.25rem;
          border-radius: 999px;
          margin: 6px auto 0;
        }
        .beacon-pdf .beacon-pdf-stat-label { font-size: 11px; color: #6a6e73; margin-top: 6px; }
        .beacon-pdf .beacon-pdf-pipeline {
          display: flex;
          align-items: flex-start;
          width: 100%;
          margin: 0;
        }
        .beacon-pdf .beacon-pdf-step {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1 1 0;
          min-width: 0;
        }
        .beacon-pdf .beacon-pdf-step-track {
          display: flex;
          align-items: center;
          width: 100%;
        }
        .beacon-pdf .beacon-pdf-step-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          color: #fff;
          flex: 0 0 auto;
        }
        .beacon-pdf .beacon-pdf-step-icon svg {
          width: 16px;
          height: 16px;
          fill: currentColor;
        }
        .beacon-pdf .beacon-pdf-step-connector {
          flex: 1 1 auto;
          height: 2px;
          background: #d2d2d2;
          margin: 0 8px;
        }
        .beacon-pdf .beacon-pdf-step-count {
          font-size: 22px;
          font-weight: 700;
          line-height: 1;
          margin-top: 8px;
        }
        .beacon-pdf .beacon-pdf-step-label {
          display: inline-block;
          max-width: 100%;
          margin-top: 6px;
          padding-bottom: 3px;
          border-bottom: 3px solid;
          font-size: 11px;
          line-height: 1.2;
        }
        .beacon-pdf table,
        .beacon-pdf .pf-v6-c-table,
        .beacon-pdf .pf-v5-c-table {
          display: table;
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }
        .beacon-pdf thead { display: table-header-group; }
        .beacon-pdf tbody { display: table-row-group; }
        .beacon-pdf tr { display: table-row; page-break-inside: avoid; }
        .beacon-pdf th, .beacon-pdf td {
          display: table-cell;
          font-size: 10px;
          vertical-align: top;
        }
        .beacon-pdf th {
          background-color: #f0f0f0;
          font-weight: 700;
          padding: 8px 8px 6px;
        }
        .beacon-pdf td { padding: 6px 8px; white-space: nowrap; }
        .beacon-pdf .beacon-pdf-status-reason {
          display: block;
          white-space: normal;
          font-size: 9px;
        }
        .beacon-pdf .beacon-pdf-vuln-table { width: 100%; }
        .beacon-pdf .beacon-pdf-vuln-table tbody tr:nth-child(even) td {
          background-color: #fafafa;
        }
        .beacon-pdf .beacon-pdf-col-vulnerabilityId,
        .beacon-pdf .beacon-pdf-col-lastUpdated,
        .beacon-pdf .beacon-pdf-col-severity,
        .beacon-pdf .beacon-pdf-col-cvss,
        .beacon-pdf .beacon-pdf-col-repository,
        .beacon-pdf .beacon-pdf-col-age,
        .beacon-pdf .beacon-pdf-col-flags,
        .beacon-pdf .beacon-pdf-col-customerPriority {
          width: 1%;
          white-space: nowrap;
        }
        .beacon-pdf .beacon-pdf-col-component,
        .beacon-pdf .beacon-pdf-col-publishedVersions,
        .beacon-pdf .beacon-pdf-col-title,
        .beacon-pdf .beacon-pdf-col-cvssVector,
        .beacon-pdf .beacon-pdf-col-batch {
          white-space: normal;
          overflow-wrap: anywhere;
        }
      `}</style>
      {includeSummary ? (
        <div className='beacon-pdf-overview'>
          <div>
            <Title headingLevel='h1' size='2xl'>
              Beacon
            </Title>
            <Content className='beacon-pdf-description'>
              Track your Lightwell submissions from initial review to fix availability.
              {lastUpdated ? (
                <>
                  <br />
                  Last updated: {lastUpdated}
                </>
              ) : null}
            </Content>
          </div>
          <div className='beacon-pdf-summary'>
            <div className='beacon-pdf-summary-title'>
              {`Status Summary${isFiltered ? ' (filtered)' : ''}`}
            </div>
            <div className='beacon-pdf-stats'>
              {summaryMetrics.map((metric) => (
                <div key={metric.label} className='beacon-pdf-stat'>
                  <div className='beacon-pdf-stat-value'>{metric.value}</div>
                  <span
                    className='beacon-pdf-stat-bar'
                    style={{ backgroundColor: metric.fill }}
                    aria-hidden='true'
                  />
                  <div className='beacon-pdf-stat-label'>{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className='beacon-pdf-pipeline' role='list' aria-label='Submission pipeline metrics'>
            {STATUSES.map((status, index) => {
              const presentation = getPipelineStepPresentation(status);
              const fill =
                (presentation && PDF_STEP_FILL[presentation.color]) || DEFAULT_COUNT_FILL;

              return (
                <div key={status} className='beacon-pdf-step' role='listitem'>
                  <div className='beacon-pdf-step-track'>
                    <span className='beacon-pdf-step-icon' style={{ backgroundColor: fill }}>
                      {presentation?.icon}
                    </span>
                    {index < STATUSES.length - 1 ? (
                      <span className='beacon-pdf-step-connector' aria-hidden='true' />
                    ) : null}
                  </div>
                  <div className='beacon-pdf-step-count'>{statusCounts[status] ?? 0}</div>
                  <div className='beacon-pdf-step-label' style={{ borderBottomColor: fill }}>
                    {statusLabel(status)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Title headingLevel='h2' size='md'>
          Vulnerabilities (continued)
        </Title>
      )}
      <Table
        variant='compact'
        className='beacon-pdf-vuln-table'
        aria-label='Lightwell vulnerabilities'
        gridBreakPoint=''
      >
        <Thead>
          <Tr>
            {columns.map((column) => (
              <Th key={column.key} className={`beacon-pdf-col-${column.key}`}>
                {column.title}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {vulnerabilities.map((vulnerability) => (
            <Tr key={vulnerability.uuid}>
              {columns.map((column) => (
                <Td
                  key={column.key}
                  dataLabel={column.title}
                  className={`beacon-pdf-col-${column.key}`}
                >
                  {column.key === 'status' ? (
                    <>
                      <span>{statusLabel(vulnerability.status)}</span>
                      {vulnerability.resolutionReason ? (
                        <Content component='small' className='beacon-pdf-status-reason'>
                          {vulnerability.resolutionReason}
                        </Content>
                      ) : null}
                    </>
                  ) : (
                    getVulnerabilityColumnValue(column.key, vulnerability)
                  )}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
};

export default BeaconPdfTemplate;
