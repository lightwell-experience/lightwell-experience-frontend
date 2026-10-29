import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LwTooltip } from './tooltip';

it('defaults the trigger to a circle plain LwButton', async () => {
  const user = userEvent.setup();
  render(<LwTooltip content='Help copy' />);

  const trigger = screen.getByRole('button', { name: 'More information' });
  expect(trigger).toHaveClass('lw-c-button');
  expect(trigger).toHaveClass('pf-m-circle');

  await user.hover(trigger);
  expect(await screen.findByText('Help copy')).toBeInTheDocument();
});

it('lets call-site children own the trigger', async () => {
  const user = userEvent.setup();
  render(
    <LwTooltip content='Custom trigger tip'>
      <button type='button'>Custom</button>
    </LwTooltip>,
  );

  expect(screen.queryByRole('button', { name: 'More information' })).not.toBeInTheDocument();
  await user.hover(screen.getByRole('button', { name: 'Custom' }));
  expect(await screen.findByText('Custom trigger tip')).toBeInTheDocument();
});
