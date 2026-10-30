import React from 'react';
import { render, screen } from '@testing-library/react';

import CoveragePdfTemplate from './CoveragePdfTemplate';
import { defaultCoverageReportItem, defaultCoverageReportPackagesItem } from 'testingHelpers';

jest.mock('@patternfly/react-charts/victory', () => ({
  Chart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ChartAxis: ({ label }: { label?: string }) => (label ? <span>{label}</span> : null),
  ChartBar: () => null,
  ChartStack: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartDonut: ({ title, subTitle }: { title?: string; subTitle?: string }) => (
    <div>
      <span>{title}</span>
      <span>{subTitle}</span>
    </div>
  ),
  ChartLabel: () => null,
}));

describe('CoveragePdfTemplate', () => {
  it('renders the summary, charts, and package rows on the first page', () => {
    render(
      <CoveragePdfTemplate
        asyncData={{
          data: {
            packages: defaultCoverageReportPackagesItem,
            meta: { count: 3, limit: 50, offset: 0 },
            report: defaultCoverageReportItem,
          },
        }}
        additionalData={{
          filename: 'sbom.json',
          generatedAt: '25 Aug 2026',
          includeSummary: true,
        }}
      />,
    );

    expect(screen.getByText('Lightwell Match Analysis Report')).toBeInTheDocument();
    expect(screen.getByText('Manifest: sbom.json · Generated: 25 Aug 2026')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('packages matched')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
    const summary = document.querySelector('.coverage-pdf-summary');
    const metricRow = document.querySelector('.coverage-pdf-metric-row');
    expect(summary?.contains(metricRow)).toBe(false);
    expect(
      summary &&
        metricRow &&
        summary.compareDocumentPosition(metricRow) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(screen.getByText('Packages by ecosystem')).toBeInTheDocument();

    const fixedCves = screen.getByText('Fixed CVEs').closest('.coverage-pdf-metric');
    expect(fixedCves).toHaveTextContent('Critical');
    expect(fixedCves).toHaveTextContent('Important');
    expect(fixedCves).toHaveTextContent('Moderate');
    expect(fixedCves).toHaveTextContent('Low');
    expect(fixedCves?.querySelectorAll('.coverage-pdf-stat-bar')).toHaveLength(4);
    expect(
      screen.getByText('Summary').compareDocumentPosition(screen.getByText('Fixed CVEs')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const packageRow = screen.getByText('spring-web').closest('tr');
    expect(packageRow).toHaveTextContent('6.1.5');
    expect(packageRow).toHaveTextContent('Exact');
    expect(packageRow).toHaveTextContent('5.4–9.8');
  });

  it('omits the CVEs-fixed section and CVE columns when there is no CVE data', () => {
    render(
      <CoveragePdfTemplate
        asyncData={{
          data: {
            packages: defaultCoverageReportPackagesItem,
            meta: { count: 3, limit: 50, offset: 0 },
            report: defaultCoverageReportItem,
          },
        }}
        additionalData={{
          filename: 'sbom.json',
          generatedAt: '25 Aug 2026',
          includeSummary: true,
          includeCveData: false,
        }}
      />,
    );

    // The rest of the cover page still renders.
    expect(screen.getByText('Lightwell Match Analysis Report')).toBeInTheDocument();
    expect(screen.getByText('Packages by ecosystem')).toBeInTheDocument();

    expect(screen.queryByText('Fixed CVEs')).not.toBeInTheDocument();
    expect(screen.queryByText('CVE Fixes (net delta)')).not.toBeInTheDocument();
    expect(screen.queryByText('CVSS Scores')).not.toBeInTheDocument();
    expect(screen.queryByText('5.4–9.8')).not.toBeInTheDocument();
  });

  it('omits the package table when only the overview is exported', () => {
    render(
      <CoveragePdfTemplate
        asyncData={{
          data: {
            packages: defaultCoverageReportPackagesItem,
            meta: { count: 3, limit: 50, offset: 0 },
            report: defaultCoverageReportItem,
          },
        }}
        additionalData={{
          filename: 'sbom.json',
          generatedAt: '25 Aug 2026',
          includeSummary: true,
          includePackages: false,
        }}
      />,
    );

    expect(screen.getByText('Lightwell Match Analysis Report')).toBeInTheDocument();
    expect(screen.getByText('Packages by ecosystem')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Packages' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('table', { name: 'Coverage report packages' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('spring-web')).not.toBeInTheDocument();
  });

  it('omits the cover summary on continuation pages', () => {
    render(
      <CoveragePdfTemplate
        asyncData={{
          data: {
            packages: defaultCoverageReportPackagesItem.slice(0, 1),
            meta: { count: 3, limit: 50, offset: 50 },
            report: null,
          },
        }}
        additionalData={{ generatedAt: '25 Aug 2026', includeSummary: false }}
      />,
    );

    expect(screen.queryByText('Lightwell Match Analysis Report')).not.toBeInTheDocument();
    expect(screen.getByText('spring-web')).toBeInTheDocument();
  });
});
