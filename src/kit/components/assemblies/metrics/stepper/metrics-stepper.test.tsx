import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RhUiInProgressIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-in-progress-icon';
import RhUiPendingIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-pending-icon';

import { LwMetricsStepper } from './metrics-stepper';

const steps = [
  {
    id: 'submitted',
    label: 'Submitted',
    tooltip: 'Submitted for review.',
    value: 4,
    icon: <RhUiPendingIcon />,
  },
  {
    id: 'classified',
    label: 'Classified',
    tooltip: 'Fix target identified.',
    value: 4,
    variant: 'info' as const,
    isCurrent: true,
    icon: <RhUiInProgressIcon />,
  },
  {
    id: 'fix',
    label: 'Fix in Progress',
    tooltip: 'Fix under development.',
    value: 0,
    variant: 'pending' as const,
    icon: <RhUiPendingIcon />,
  },
];

it('renders an unhydrated pending shell from steps (no compact)', () => {
  const { container } = render(<LwMetricsStepper aria-label='Pipeline metrics' steps={steps} />);

  const root = container.querySelector('.pf-v6-c-progress-stepper');
  expect(root).toHaveClass('lw-c-metrics-stepper');
  expect(root).toHaveClass('lw-m-unhydrated');
  expect(root).not.toHaveClass('pf-m-compact');
  expect(root).toHaveAttribute('aria-label', 'Pipeline metrics');
  expect(container.querySelectorAll('.pf-v6-c-progress-stepper__step')).toHaveLength(3);
  expect(container.querySelectorAll('.pf-m-pending')).toHaveLength(3);
  // Count + text wraps are always present so CSS can hide them pre-hydrate.
  expect(container.querySelectorAll('.lw-c-metrics-stepper__count')).toHaveLength(3);
  expect(container.querySelectorAll('.lw-c-metrics-stepper__text')).toHaveLength(3);
  expect(container.querySelector('.lw-c-metrics-stepper__text')?.textContent).toMatch(/Submitted/);
});

it('applies PF variants, custom icons, and stacked truncated values when hydrated', () => {
  const { container } = render(
    <LwMetricsStepper aria-label='Pipeline metrics' isHydrated steps={steps} />,
  );

  const root = container.querySelector('.pf-v6-c-progress-stepper');
  expect(root).toHaveClass('lw-m-hydrated');
  expect(root).not.toHaveClass('pf-m-compact');
  expect(root).not.toHaveClass('pf-m-center');
  expect(container.querySelectorAll('.pf-m-info').length).toBeGreaterThan(0);
  expect(container.querySelectorAll('.pf-m-current').length).toBeGreaterThan(0);
  expect(container.querySelectorAll('.lw-c-metrics-stepper__icon-trigger')).toHaveLength(3);
  expect(container.querySelectorAll('.lw-c-metrics-stepper__count')).toHaveLength(3);
  expect(container.querySelectorAll('.lw-c-metrics-stepper__text')).toHaveLength(3);
  expect(screen.getByText(/Submitted/)).toBeInTheDocument();
  // Count stacks above label in the title (not PF description); container Truncate (not pf-m-fixed).
  expect(container.querySelectorAll('.pf-v6-c-progress-stepper__step-description')).toHaveLength(0);
  expect(container.querySelectorAll('.pf-v6-c-truncate')).toHaveLength(3);
  expect(container.querySelector('.pf-m-fixed')).toBeNull();
  expect(container.querySelector('.lw-c-metrics-stepper__count')?.textContent).toMatch(/4/);
  expect(container.querySelector('.lw-c-metrics-stepper__text')?.textContent).toMatch(/Submitted/);
  // Spacing between count and label is CSS gap on the title — not an &nbsp; in the DOM.
  const title = container.querySelector('.pf-v6-c-progress-stepper__step-title');
  expect(title?.innerHTML.includes('&nbsp;') || title?.innerHTML.includes('\u00a0')).toBe(false);
  expect(title).toContainElement(container.querySelector('.lw-c-metrics-stepper__count'));
  expect(title).toContainElement(container.querySelector('.lw-c-metrics-stepper__text'));
});

it('wraps string/number values in PF Truncate without maxChars / pf-m-fixed', () => {
  const { container } = render(
    <LwMetricsStepper
      aria-label='Pipeline metrics'
      isHydrated
      steps={[{ ...steps[0], value: 123456789012 }]}
    />,
  );

  const truncate = container.querySelector('.pf-v6-c-truncate');
  expect(truncate).toBeTruthy();
  expect(truncate).not.toHaveClass('pf-m-fixed');
  // Full content remains in the Truncate tree; width ellipsis is layout-dependent.
  expect(truncate?.textContent).toContain('123456789012');
});

it('maps steps[].color to stepIcon CSS var when hydrated', () => {
  const { container } = render(
    <LwMetricsStepper
      aria-label='Pipeline metrics'
      isHydrated
      steps={[
        { ...steps[0], color: 'blue' },
        { ...steps[1], color: 'orange' },
        { ...steps[2], color: 'none' },
      ]}
    />,
  );

  const colored = container.querySelectorAll('.lw-m-color');
  expect(colored).toHaveLength(3);
  expect(colored[0]).toHaveStyle({
    '--lw-metrics-step-icon-bg': 'var(--lw-color--step-icon--blue)',
  });
  expect(colored[1]).toHaveStyle({
    '--lw-metrics-step-icon-bg': 'var(--lw-color--step-icon--orange)',
  });
  expect(colored[2]).toHaveStyle({
    '--lw-metrics-step-icon-bg': 'var(--lw-color--match-status--none)',
  });
  expect(colored[2]).toHaveClass('lw-m-color-muted-fg');
});

it('does not apply color classes while unhydrated', () => {
  const { container } = render(
    <LwMetricsStepper aria-label='Pipeline metrics' steps={[{ ...steps[0], color: 'exact' }]} />,
  );

  expect(container.querySelector('.lw-m-color')).toBeNull();
});

it('shows step tooltips on the icon trigger, not as a title help button', async () => {
  const user = userEvent.setup();
  render(<LwMetricsStepper aria-label='Pipeline metrics' steps={steps} />);

  // Titles stay plain (no popoverRender help-text button).
  expect(screen.queryByRole('button', { name: /Submitted/i })).not.toBeInTheDocument();

  await user.hover(screen.getByRole('img', { name: 'Submitted: more information' }));

  expect(await screen.findByText('Submitted for review.')).toBeInTheDocument();
});

it('merges call-site className onto the ProgressStepper host', () => {
  const { container } = render(
    <LwMetricsStepper aria-label='Pipeline metrics' className='lw-stepper-test' steps={steps} />,
  );

  const root = container.querySelector('.pf-v6-c-progress-stepper');
  expect(root).toHaveClass('lw-c-metrics-stepper');
  expect(root).toHaveClass('lw-stepper-test');
});

it('applies pf-m-horizontal by default and honors isHorizontal / isVertical passthrough', () => {
  const { container, rerender } = render(
    <LwMetricsStepper aria-label='Pipeline metrics' steps={steps} />,
  );

  const root = () => container.querySelector('.pf-v6-c-progress-stepper');
  expect(root()).toHaveClass('pf-m-horizontal');
  expect(root()).not.toHaveClass('pf-m-vertical');

  rerender(<LwMetricsStepper aria-label='Pipeline metrics' isHorizontal={false} steps={steps} />);
  expect(root()).not.toHaveClass('pf-m-horizontal');

  rerender(
    <LwMetricsStepper
      aria-label='Pipeline metrics'
      isHorizontal={false}
      isVertical
      steps={steps}
    />,
  );
  expect(root()).toHaveClass('pf-m-vertical');
  expect(root()).not.toHaveClass('pf-m-horizontal');
});
