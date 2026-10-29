import { render, screen } from '@testing-library/react';

import { LwMetricsDonutChart } from './metrics-donut-chart';

it('renders the donut host with title and kit class', () => {
  const { container } = render(
    <LwMetricsDonutChart
      data={[
        { x: 'Exact match', y: 60 },
        { x: 'Partial match', y: 15 },
        { x: 'No match', y: 25 },
      ]}
      width={320}
      height={280}
      title='75%'
      subTitle='packages matched'
      ariaDesc='Match summary donut chart'
    />,
  );

  expect(container.querySelector('.lw-c-metrics-donut-chart')).toBeTruthy();
  expect(screen.getByText('75%')).toBeInTheDocument();
});
