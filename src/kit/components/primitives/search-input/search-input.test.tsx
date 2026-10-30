import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LwSearchInput } from './search-input';

it('renders a search input with lw-c-search-input class', () => {
  const { container } = render(
    <LwSearchInput aria-label='Search' placeholder='Filter by name...' />,
  );

  expect(screen.getByPlaceholderText('Filter by name...')).toBeInTheDocument();
  expect(container.querySelector('.lw-c-search-input')).toBeInTheDocument();
});

it('calls onChange when the user types', async () => {
  const user = userEvent.setup();
  const handleChange = jest.fn();

  render(
    <LwSearchInput
      aria-label='Search'
      placeholder='Search...'
      onChange={(_e, val) => handleChange(val)}
    />,
  );

  await user.type(screen.getByPlaceholderText('Search...'), 'a');
  expect(handleChange).toHaveBeenCalledWith('a');
});

it('merges call-site className', () => {
  const { container } = render(<LwSearchInput aria-label='Search' className='custom-search' />);

  const el = container.querySelector('.lw-c-search-input');
  expect(el).toHaveClass('custom-search');
});
