import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LwMetricsCount } from './metrics-count';

it('renders value and label with default blue status bar', () => {
  const { container } = render(<LwMetricsCount value={34} label='Exact match' />);

  const root = container.querySelector('.lw-c-metrics-count');
  expect(root).toHaveClass('lw-m-column');
  expect(root).toHaveClass('lw-m-has-bar');
  expect(root).toHaveStyle({
    '--lw-metrics-count-bar-color': 'var(--lw-color--step-icon--blue)',
  });
  expect(screen.getByRole('heading', { level: 4, name: '34' })).toBeInTheDocument();
  expect(screen.getByText('Exact match')).toBeInTheDocument();
  expect(container.querySelector('.lw-c-metrics-count__bar')).toBeInTheDocument();
});

it('maps color to status bar CSS var from stepIcon', () => {
  const { container } = render(<LwMetricsCount value={17} label='Partial match' color='partial' />);

  const root = container.querySelector('.lw-c-metrics-count');
  expect(root).toHaveClass('lw-m-has-bar');
  expect(root).toHaveStyle({
    '--lw-metrics-count-bar-color': 'var(--lw-color--match-status--partial)',
  });
  expect(container.querySelector('.lw-c-metrics-count__bar')).toBeInTheDocument();
});

it('applies row direction modifier', () => {
  const { container } = render(<LwMetricsCount value={5} label='Critical' direction='row' />);

  expect(container.querySelector('.lw-c-metrics-count')).toHaveClass('lw-m-row');
});

it('shows label tooltip on help icon hover', async () => {
  const user = userEvent.setup();
  render(
    <LwMetricsCount value={82} label='No match' tooltip='Package not found in the catalog.' />,
  );

  await user.hover(document.querySelector('.lw-c-metrics-count__help') as HTMLElement);

  expect(await screen.findByText('Package not found in the catalog.')).toBeInTheDocument();
});

it('merges call-site className onto the host root', () => {
  const { container } = render(
    <LwMetricsCount value={1} label='Total' className='lw-count-test' />,
  );

  const root = container.querySelector('.lw-c-metrics-count');
  expect(root).toHaveClass('lw-count-test');
});

it('renders matched-size skeletons instead of value/label when isLoading', () => {
  const { container } = render(
    <LwMetricsCount isLoading loadingScreenReaderText='Loading total' color='partial' />,
  );

  expect(container.querySelectorAll('.pf-v6-c-skeleton')).toHaveLength(2);
  expect(screen.getByText('Loading total')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { level: 4 })).not.toBeInTheDocument();
  expect(container.querySelector('.lw-c-metrics-count__bar')).not.toBeInTheDocument();
});
