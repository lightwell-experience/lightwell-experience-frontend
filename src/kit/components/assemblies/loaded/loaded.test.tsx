import { render, screen } from '@testing-library/react';

import { LwLoaded } from './loaded';

it('shows a PatternFly text skeleton by default (no fixed height slab)', () => {
  const { container } = render(
    <LwLoaded>
      <span>Ready</span>
    </LwLoaded>,
  );

  const skeleton = container.querySelector('.pf-v6-c-skeleton');
  expect(container.querySelector('.lw-c-loaded')).toHaveClass('lw-m-loading');
  expect(container.querySelector('.lw-c-loaded')).toHaveAttribute('aria-busy', 'true');
  expect(skeleton).toHaveClass('lw-c-skeleton');
  expect(skeleton).toHaveClass('pf-m-text-md');
  expect(skeleton).not.toHaveStyle({ '--pf-v6-c-skeleton--Height': '7.5rem' });
  expect(screen.queryByText('Ready')).not.toBeInTheDocument();
});

it('renders children without a loading host when isLoaded', () => {
  const { container } = render(
    <LwLoaded isLoaded>
      <span>Ready</span>
    </LwLoaded>,
  );

  expect(container.querySelector('.lw-c-loaded')).toBeNull();
  expect(container.querySelector('.pf-v6-c-skeleton')).toBeNull();
  expect(screen.getByText('Ready')).toBeInTheDocument();
});

it('lets call-site fallback replace the default skeleton', () => {
  render(
    <LwLoaded fallback={<span>Custom loading</span>}>
      <span>Ready</span>
    </LwLoaded>,
  );

  expect(screen.getByText('Custom loading')).toBeInTheDocument();
  expect(screen.queryByText('Ready')).not.toBeInTheDocument();
});
