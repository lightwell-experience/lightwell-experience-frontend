import { render, screen, within } from '@testing-library/react';

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

describe('legend', () => {
  const data = [
    { x: 'On Hold', y: 3 },
    { x: 'No remediation', y: 7 },
    { x: 'In Pipeline', y: 13 },
  ];
  const baseProps = {
    data,
    width: 220,
    height: 220,
    title: '23',
    subTitle: 'Total',
    ariaDesc: 'Status donut',
  };

  it('does not render a legend by default', () => {
    const { container } = render(<LwMetricsDonutChart {...baseProps} />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(container.querySelector('.lw-m-legend')).toBeNull();
  });

  it('renders one row per slice as "label: count"', () => {
    render(<LwMetricsDonutChart {...baseProps} showLegend />);

    const rows = within(screen.getByRole('list', { name: 'Status donut legend' })).getAllByRole(
      'listitem',
    );
    expect(rows.map((row) => row.textContent)).toEqual([
      'On Hold: 3',
      'No remediation: 7',
      'In Pipeline: 13',
    ]);
  });

  it('keeps list semantics explicit and names the list apart from the chart description', () => {
    render(<LwMetricsDonutChart {...baseProps} showLegend />);

    const legend = screen.getByRole('list', { name: 'Status donut legend' });
    expect(legend).toHaveAttribute('role', 'list');
  });

  it('paints each swatch from the matching color', () => {
    render(<LwMetricsDonutChart {...baseProps} colorScale={['red', 'green', 'blue']} showLegend />);

    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(rows.map((row) => row.style.getPropertyValue('--lw-metrics-donut-swatch'))).toEqual([
      'red',
      'green',
      'blue',
    ]);
  });

  it('uses legendAriaLabel and formatLegendLabel when given', () => {
    render(
      <LwMetricsDonutChart
        {...baseProps}
        showLegend
        legendAriaLabel='Status summary'
        formatLegendLabel={({ datum }) => `${datum.x} (${datum.y})`}
      />,
    );

    const legend = screen.getByRole('list', { name: 'Status summary' });
    expect(within(legend).getByText('On Hold (3)')).toBeInTheDocument();
  });

  it.each(['right', 'bottom', 'responsive'] as const)(
    'applies the %s position class',
    (position) => {
      const { container } = render(
        <LwMetricsDonutChart {...baseProps} showLegend legendPosition={position} />,
      );

      expect(container.querySelector('.lw-c-metrics-donut-chart')).toHaveClass(
        'lw-m-legend',
        `lw-m-legend-${position}`,
      );
    },
  );

  it('defaults the legend to the right of the ring', () => {
    const { container } = render(<LwMetricsDonutChart {...baseProps} showLegend />);

    expect(container.querySelector('.lw-c-metrics-donut-chart')).toHaveClass('lw-m-legend-right');
  });
});
