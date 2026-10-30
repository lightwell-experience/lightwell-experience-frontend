import { render, screen } from '@testing-library/react';

import { LwContent } from './content';

it('renders children in a PF Content host with lw-c-content class', () => {
  render(<LwContent component='p'>Hello world</LwContent>);

  const el = screen.getByText('Hello world');
  expect(el.tagName).toBe('P');
  expect(el).toHaveClass('lw-c-content');
});

it('merges call-site className with lw-c-content', () => {
  render(
    <LwContent component='small' className='custom'>
      Sub text
    </LwContent>,
  );

  const el = screen.getByText('Sub text');
  expect(el.tagName).toBe('SMALL');
  expect(el).toHaveClass('lw-c-content');
  expect(el).toHaveClass('custom');
});
