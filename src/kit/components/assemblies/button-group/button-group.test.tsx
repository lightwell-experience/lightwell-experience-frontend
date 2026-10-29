import { render, screen } from '@testing-library/react';

import { LwButton } from 'kit/components/primitives';
import { LwButtonGroup } from './button-group';

it('renders children in the button-group host', () => {
  render(
    <LwButtonGroup>
      <LwButton>One</LwButton>
      <LwButton>Two</LwButton>
    </LwButtonGroup>,
  );

  const group = document.querySelector('.lw-c-button-group');
  expect(group).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'One' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Two' })).toBeInTheDocument();
  expect(group).toContainElement(screen.getByRole('button', { name: 'One' }));
  expect(group).toContainElement(screen.getByRole('button', { name: 'Two' }));
});

it('merges call-site className onto the host', () => {
  const { container } = render(
    <LwButtonGroup className='extra'>
      <span>child</span>
    </LwButtonGroup>,
  );

  expect(container.firstChild).toHaveClass('lw-c-button-group');
  expect(container.firstChild).toHaveClass('extra');
});
