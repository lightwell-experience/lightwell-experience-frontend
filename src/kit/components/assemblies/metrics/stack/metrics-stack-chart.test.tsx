import { render, screen } from '@testing-library/react';

import { LwMetricsStackChart } from './metrics-stack-chart';

it('renders the stack host and screen-reader table', () => {
  const { container } = render(
    <LwMetricsStackChart
      series={[
        {
          id: 'exact',
          label: 'Exact match',
          data: [{ x: 'maven', y: 10, fill: 'green', supported: true }],
        },
        {
          id: 'partial',
          label: 'Partial match',
          data: [{ x: 'maven', y: 2, fill: 'orange', supported: true }],
        },
      ]}
      width={500}
      height={200}
      a11yTable={{
        caption: 'Package matches by ecosystem',
        columns: ['Exact match', 'Partial match'],
        rows: [{ rowHeader: 'Maven', values: [10, 2] }],
      }}
    />,
  );

  expect(container.querySelector('.lw-c-metrics-stack-chart')).toBeTruthy();
  expect(screen.getByText('Package matches by ecosystem')).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Exact match' })).toBeInTheDocument();
});
