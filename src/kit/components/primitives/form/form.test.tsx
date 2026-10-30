import { render, screen } from '@testing-library/react';

import { LwForm } from './form';

it('renders with the lw-c-form class on the form element', () => {
  render(<LwForm aria-label='Test form'>form content</LwForm>);

  const form = screen.getByRole('form', { name: 'Test form' });
  expect(form).toHaveClass('lw-c-form');
});

it('merges call-site className with lw-c-form', () => {
  render(
    <LwForm aria-label='Test form' className='custom-class'>
      form content
    </LwForm>,
  );

  const form = screen.getByRole('form', { name: 'Test form' });
  expect(form).toHaveClass('lw-c-form');
  expect(form).toHaveClass('custom-class');
});

it('renders children as form content', () => {
  render(
    <LwForm aria-label='Test form'>
      <input type='text' aria-label='Name' />
    </LwForm>,
  );

  expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
});
