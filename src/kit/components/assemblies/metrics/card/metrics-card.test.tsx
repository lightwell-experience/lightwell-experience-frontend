import { render, screen } from '@testing-library/react';

import { LwMetricsCount } from '../count/metrics-count';
import { LwMetricsCard } from './metrics-card';

it('renders composable body content inside LwCard', () => {
  const { container } = render(
    <LwMetricsCard
      hasHeader='Status Summary'
      items={[
        <LwMetricsCount key='total' value={26} label='Total' />,
        <LwMetricsCount key='critical' value={5} label='Critical' color='red' />,
      ]}
    />,
  );

  expect(container.querySelector('.lw-c-metrics-card')).toBeInTheDocument();
  expect(container.querySelector('.lw-c-card')).toBeInTheDocument();
  expect(screen.getByText('Status Summary')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 4, name: '26' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 4, name: '5' })).toBeInTheDocument();
  expect(screen.getByText('Total')).toBeInTheDocument();
  expect(screen.getByText('Critical')).toBeInTheDocument();
  expect(container.querySelectorAll('.lw-c-metrics-count')).toHaveLength(2);
});

it('passthrough children win over items', () => {
  const { container } = render(
    <LwMetricsCard
      hasHeader='Matches'
      items={[<LwMetricsCount key='ignored' value={99} label='Ignored' />]}
    >
      <LwMetricsCount value={34} label='Exact match' color='exact' />
    </LwMetricsCard>,
  );

  expect(screen.getByText('Exact match')).toBeInTheDocument();
  expect(screen.queryByText('Ignored')).not.toBeInTheDocument();
  expect(container.querySelectorAll('.lw-c-metrics-count')).toHaveLength(1);
});

it('merges call-site className onto the card host', () => {
  const { container } = render(
    <LwMetricsCard
      className='lw-card-test'
      items={[<LwMetricsCount key='total' value={1} label='Total' />]}
    />,
  );

  expect(container.querySelector('.lw-c-card')).toHaveClass('lw-c-metrics-card');
  expect(container.querySelector('.lw-c-card')).toHaveClass('lw-card-test');
});

it('places items inside CardBody when there is no header', () => {
  const { container } = render(
    <LwMetricsCard items={[<LwMetricsCount key='total' value={1} label='Total' />]} />,
  );

  const body = container.querySelector('.pf-v6-c-card__body');
  expect(body).toBeTruthy();
  expect(body?.querySelector('.lw-c-metrics-count')).toBeTruthy();
});

it('renders empty card body when neither children nor items are set', () => {
  render(<LwMetricsCard hasHeader='Empty' />);

  expect(screen.getByText('Empty')).toBeInTheDocument();
  expect(screen.getByText('No content')).toBeInTheDocument();
});
