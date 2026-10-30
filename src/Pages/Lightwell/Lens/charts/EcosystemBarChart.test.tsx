import React, { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';

import { getEcosystemBarChartHeight } from './ecosystemBarModel';
import { MOCK_REPORT } from '../../mockCoverageAnalysis';
import EcosystemBarChart from './EcosystemBarChart';

jest.mock('@patternfly/react-charts/victory', () => ({
  Chart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ChartAxis: ({ label }: { label?: string }) => (label ? <span>{label}</span> : null),
  ChartBar: () => null,
  ChartStack: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ChartTooltip: () => null,
}));

describe('EcosystemBarChart', () => {
  it('hides the plot from assistive tech and exposes a screen-reader table on web', () => {
    const { container } = render(
      <EcosystemBarChart
        report={MOCK_REPORT}
        containerRef={createRef<HTMLDivElement>()}
        width={500}
        height={getEcosystemBarChartHeight(MOCK_REPORT.ecosystem_coverage_summary.length)}
      />,
    );

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByText('Packages')).not.toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Package matches by ecosystem' });
    expect(table.parentElement).toHaveClass('pf-v6-screen-reader');
    expect(within(table).getByRole('columnheader', { name: 'Exact match' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Partial match' })).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: 'Java 450 110 90' })).toBeInTheDocument();
    expect(
      within(table).getByRole('row', { name: 'Rust (Unsupported) 0 0 30' }),
    ).toBeInTheDocument();
  });

  it('shows the legend and Packages axis title on pdf without a table', () => {
    const { container } = render(
      <EcosystemBarChart
        surface='pdf'
        report={MOCK_REPORT}
        width={720}
        height={getEcosystemBarChartHeight(MOCK_REPORT.ecosystem_coverage_summary.length)}
      />,
    );

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Packages')).toBeInTheDocument();
    expect(screen.getByText('Exact match')).toBeInTheDocument();
    expect(screen.getByText('Partial match')).toBeInTheDocument();
  });
});
