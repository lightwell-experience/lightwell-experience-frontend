import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LwToggleGroup } from './toggle-group';

const ITEMS = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
];

it('renders items from the items slot, selecting the one matching value', () => {
  render(<LwToggleGroup aria-label='Choice' items={ITEMS} value='two' />);

  expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-pressed', 'true');
});

it('calls onChange with the clicked item value', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  render(<LwToggleGroup aria-label='Choice' items={ITEMS} value='one' onChange={onChange} />);

  await user.click(screen.getByRole('button', { name: 'Two' }));

  expect(onChange).toHaveBeenCalledWith('two');
});

it('renders passthrough children instead of items when both are given', () => {
  render(
    <LwToggleGroup aria-label='Choice' items={ITEMS}>
      <button type='button'>Custom</button>
    </LwToggleGroup>,
  );

  expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'One' })).not.toBeInTheDocument();
});
