import { EmptyStateBody } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';

import { LwEmptyState } from './empty-state';

it('harnesses the EmptyState root and passes children through', () => {
  render(
    <LwEmptyState headingLevel='h2' titleText='Select customer'>
      <EmptyStateBody>Pick a customer ID first.</EmptyStateBody>
    </LwEmptyState>,
  );

  const title = screen.getByRole('heading', { level: 2, name: 'Select customer' });
  expect(title.closest('.pf-v6-c-empty-state')).toHaveClass('lw-c-empty-state');
  expect(screen.getByText('Pick a customer ID first.')).toBeInTheDocument();
});
