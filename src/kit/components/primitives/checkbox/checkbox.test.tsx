import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LwCheckbox } from './checkbox';

it('renders with the lw-c-checkbox class on the checkbox wrapper', () => {
  render(<LwCheckbox id='test-cb' label='Test option' isChecked={false} onChange={() => {}} />);

  const wrapper = screen.getByRole('checkbox', { name: 'Test option' }).closest('.lw-c-checkbox');
  expect(wrapper).toBeInTheDocument();
});

it('merges call-site className with lw-c-checkbox', () => {
  render(
    <LwCheckbox
      id='test-cb'
      label='Test option'
      isChecked={false}
      onChange={() => {}}
      className='custom-class'
    />,
  );

  const wrapper = screen.getByRole('checkbox', { name: 'Test option' }).closest('.lw-c-checkbox');
  expect(wrapper).toHaveClass('lw-c-checkbox');
  expect(wrapper).toHaveClass('custom-class');
});

it('calls onChange with the new checked state when clicked', async () => {
  const user = userEvent.setup();
  const handleChange = jest.fn();

  render(<LwCheckbox id='test-cb' label='Toggle me' isChecked={false} onChange={handleChange} />);

  await user.click(screen.getByRole('checkbox', { name: 'Toggle me' }));
  expect(handleChange).toHaveBeenCalledTimes(1);
  expect(handleChange).toHaveBeenCalledWith(expect.anything(), true);
});

it('renders as checked when isChecked is true', () => {
  render(<LwCheckbox id='test-cb' label='Checked' isChecked onChange={() => {}} />);

  expect(screen.getByRole('checkbox', { name: 'Checked' })).toBeChecked();
});

it('renders as disabled when isDisabled is true', () => {
  render(
    <LwCheckbox id='test-cb' label='Disabled' isChecked={false} onChange={() => {}} isDisabled />,
  );

  expect(screen.getByRole('checkbox', { name: 'Disabled' })).toBeDisabled();
});
