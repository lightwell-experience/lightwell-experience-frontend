import { render, screen } from '@testing-library/react';

import { LwErrorState } from './error-state';

it('harnesses the ErrorState root and renders its slots', () => {
  render(<LwErrorState titleText='Unable to load' bodyText='Try again later.' />);

  const title = screen.getByRole('heading', { name: 'Unable to load' });
  expect(title.closest('.pf-v6-c-empty-state')).toHaveClass('lw-c-error-state');
  expect(screen.getByText('Try again later.')).toBeInTheDocument();
});
