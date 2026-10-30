import { render, screen } from '@testing-library/react';

import { mockVulnerabilities } from '../../mockVulnerabilities';
import BeaconPdfTemplate from './BeaconPdfTemplate';

const meta = {
  count: mockVulnerabilities.length,
  criticalCount: 1,
  statusCounts: { Submitted: 1, Classified: 1 },
};

describe('BeaconPdfTemplate', () => {
  it('renders summary stats and vulnerability rows on the first page', () => {
    render(
      <BeaconPdfTemplate
        asyncData={{
          data: { vulnerabilities: mockVulnerabilities.slice(0, 2), meta },
        }}
        additionalData={{
          customerId: 'CID-01',
          generatedAt: '25 Aug 2026',
          lastUpdated: '2026-10-02 08:00',
          includeSummary: true,
          visibleColumns: [
            { key: 'vulnerabilityId', title: 'Vulnerability ID' },
            { key: 'status', title: 'Status' },
          ],
          landscape: false,
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Beacon' })).toBeInTheDocument();
    expect(
      screen.getByText(/Track your Lightwell submissions from initial review to fix availability/),
    ).toHaveTextContent('Last updated: 2026-10-02 08:00');
    expect(document.querySelector('.beacon-pdf--portrait')).toBeInTheDocument();
    expect(screen.queryByText(/Customer ID:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Generated:/)).not.toBeInTheDocument();
    const summary = screen.getByText('Status Summary');
    const pipeline = screen.getByLabelText('Submission pipeline metrics');
    expect(
      summary.compareDocumentPosition(pipeline) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText('Total')).toBeInTheDocument();
    const critical = screen.getByText('Critical');
    const onHold = screen.getByText('On Hold');
    const noRemediation = screen.getByText('No remediation');
    expect(
      critical.compareDocumentPosition(onHold) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      onHold.compareDocumentPosition(noRemediation) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(critical.closest('.beacon-pdf-stat')?.querySelector('.beacon-pdf-stat-bar')).toHaveStyle(
      {
        backgroundColor: '#731f00',
      },
    );
    expect(onHold.closest('.beacon-pdf-stat')?.querySelector('.beacon-pdf-stat-bar')).toHaveStyle({
      backgroundColor: '#4d4d4d',
    });
    expect(pipeline).not.toHaveTextContent('On Hold');
    expect(pipeline).toHaveClass('beacon-pdf-pipeline');
    expect(pipeline.querySelectorAll('.beacon-pdf-step')).toHaveLength(5);
    expect(pipeline.querySelectorAll('.beacon-pdf-step-icon')).toHaveLength(5);
    expect(pipeline.querySelectorAll('.beacon-pdf-step-connector')).toHaveLength(4);
    expect(pipeline).toHaveTextContent('Submitted');
    expect(pipeline).toHaveTextContent('Available in Lightwell Network');
    expect(pipeline).not.toHaveTextContent('No remediation');
    const vulnTable = screen.getByLabelText('Lightwell vulnerabilities');
    expect(vulnTable).not.toHaveClass('pf-m-grid-md', 'pf-m-grid-lg');
    const vulnRow = screen.getByText('LWL-2026-4401').closest('tr');
    expect(vulnRow).toHaveTextContent('Submitted');
    expect(vulnRow?.querySelector('.beacon-pdf-status-reason')).not.toBeInTheDocument();
    expect(vulnRow?.querySelectorAll('td')).toHaveLength(2);
  });

  it('prints a resolution reason under the status', () => {
    const reason = 'The vulnerable code is not present in this package at this version.';

    render(
      <BeaconPdfTemplate
        asyncData={{
          data: {
            vulnerabilities: [
              {
                ...mockVulnerabilities[0],
                status: 'Unremediated',
                resolutionReason: reason,
              },
            ],
            meta: { ...meta, statusCounts: { Unremediated: 1 } },
          },
        }}
        additionalData={{
          includeSummary: true,
          isFiltered: true,
          visibleColumns: [
            { key: 'vulnerabilityId', title: 'Vulnerability ID' },
            { key: 'status', title: 'Status' },
          ],
        }}
      />,
    );

    expect(screen.getByText('Status Summary (filtered)')).toBeInTheDocument();
    expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument();

    const noRemediationStat = screen
      .getByText('No remediation', { selector: '.beacon-pdf-stat-label' })
      .closest('.beacon-pdf-stat');
    expect(noRemediationStat).toHaveTextContent('1');

    const statusCell = screen
      .getByText('LWL-2026-4401')
      .closest('tr')
      ?.querySelector('[data-label="Status"]');
    expect(statusCell).toHaveTextContent('No remediation');
    expect(statusCell?.querySelector('.beacon-pdf-status-reason')).toHaveTextContent(reason);
  });

  it('omits the cover summary on continuation pages', () => {
    render(
      <BeaconPdfTemplate
        asyncData={{
          data: { vulnerabilities: mockVulnerabilities.slice(0, 1), meta },
        }}
        additionalData={{
          customerId: 'CID-01',
          generatedAt: '25 Aug 2026',
          includeSummary: false,
          visibleColumns: [{ key: 'vulnerabilityId', title: 'Vulnerability ID' }],
          landscape: true,
        }}
      />,
    );

    expect(screen.queryByRole('heading', { name: 'Beacon' })).not.toBeInTheDocument();
    expect(screen.queryByText('Status Summary')).not.toBeInTheDocument();
    expect(document.querySelector('.beacon-pdf--landscape')).toBeInTheDocument();
    expect(screen.getByText('Vulnerabilities (continued)')).toBeInTheDocument();
    expect(screen.getByText('LWL-2026-4401')).toBeInTheDocument();
  });

  it('renders published versions as a comma-separated list and is empty when none exist', () => {
    render(
      <BeaconPdfTemplate
        asyncData={{
          data: {
            vulnerabilities: [
              mockVulnerabilities[4],
              { ...mockVulnerabilities[0], publishedVersions: [] },
            ],
            meta,
          },
        }}
        additionalData={{
          customerId: 'CID-214',
          generatedAt: '25 Aug 2026',
          includeSummary: false,
          visibleColumns: [
            { key: 'vulnerabilityId', title: 'Vulnerability ID' },
            { key: 'publishedVersions', title: 'Published Versions' },
          ],
        }}
      />,
    );

    const publishedRow = screen.getByText('LWL-2026-4001').closest('tr');
    expect(publishedRow).toHaveTextContent('1.10.1.rhlw-00002, 1.10.0.rhlw-00001');

    const emptyRow = screen.getByText('LWL-2026-4401').closest('tr');
    expect(emptyRow?.querySelector('[data-label="Published Versions"]')).toHaveTextContent('');
  });
});
