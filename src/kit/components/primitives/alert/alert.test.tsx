import { render, screen } from '@testing-library/react';

import { LwAlert } from './alert';

it('applies configured sensitive-data baseline onto the PF Alert host', () => {
  const { container } = render(<LwAlert />);

  const host = container.querySelector('.lw-c-alert');
  expect(host).toBeTruthy();
  expect(host).toHaveClass('pf-v6-c-alert');
  expect(host).toHaveClass('pf-m-warning');
  expect(host).toHaveClass('pf-m-inline');
  expect(
    screen.getByText('This data is sensitive. Do not share or capture screenshots.'),
  ).toBeInTheDocument();
});

it('lets call-site title win over the config default', () => {
  render(<LwAlert title='Custom alert' />);
  expect(screen.getByText('Custom alert')).toBeInTheDocument();
  expect(
    screen.queryByText('This data is sensitive. Do not share or capture screenshots.'),
  ).not.toBeInTheDocument();
});
