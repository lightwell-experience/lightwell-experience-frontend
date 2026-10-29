import { render, screen } from '@testing-library/react';

import { LwButton } from './button';

it('passes PF isCircle through to pf-m-circle on the Button host', () => {
  render(
    <LwButton isCircle variant='plain' aria-label='Help'>
      ?
    </LwButton>,
  );

  const button = screen.getByRole('button', { name: 'Help' });
  expect(button).toHaveClass('lw-c-button');
  expect(button).toHaveClass('pf-m-circle');
});
