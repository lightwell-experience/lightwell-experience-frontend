import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LwMenu } from './menu';

it('renders a toggle with the given label', () => {
  render(<LwMenu label='Export' items={[{ id: 'csv', children: 'Export as CSV' }]} />);

  expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
});

it('opens and lists items from the items slot', async () => {
  const user = userEvent.setup();
  render(
    <LwMenu
      label='Export'
      items={[
        { id: 'csv', children: 'Export as CSV' },
        { id: 'json', children: 'Export as JSON' },
      ]}
    />,
  );

  await user.click(screen.getByRole('button', { name: 'Export' }));

  expect(screen.getByRole('menuitem', { name: 'Export as CSV' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Export as JSON' })).toBeInTheDocument();
});

it('closes and invokes onSelect when an item is chosen', async () => {
  const onSelect = jest.fn();
  const user = userEvent.setup();
  render(<LwMenu label='Export' items={[{ id: 'csv', children: 'Export as CSV', onSelect }]} />);

  await user.click(screen.getByRole('button', { name: 'Export' }));
  await user.click(screen.getByRole('menuitem', { name: 'Export as CSV' }));

  expect(onSelect).toHaveBeenCalledTimes(1);
  await waitFor(() => {
    expect(screen.queryByRole('menuitem', { name: 'Export as CSV' })).not.toBeInTheDocument();
  });
});

it('disables the toggle and shows busy label while isBusy', () => {
  render(
    <LwMenu
      label='Export'
      busyLabel='Exporting'
      isBusy
      items={[{ id: 'csv', children: 'Export as CSV' }]}
    />,
  );

  const toggle = screen.getByRole('button', { name: 'Exporting' });
  expect(toggle).toBeDisabled();
  expect(toggle).toHaveAttribute('aria-busy', 'true');
});

it('does not open while isBusy', async () => {
  const user = userEvent.setup();
  render(
    <LwMenu
      label='Export'
      busyLabel='Exporting'
      isBusy
      items={[{ id: 'csv', children: 'Export as CSV' }]}
    />,
  );

  await user.click(screen.getByRole('button', { name: 'Exporting' }));

  expect(screen.queryByRole('menuitem', { name: 'Export as CSV' })).not.toBeInTheDocument();
});

it('merges call-site className onto the Dropdown Menu host when open', async () => {
  const user = userEvent.setup();
  render(<LwMenu label='Export' className='lw-menu-test' items={[{ id: 'a', children: 'A' }]} />);

  await user.click(screen.getByRole('button', { name: 'Export' }));

  // PF applies Dropdown className to Menu (mounted while open), not the toggle.
  const root = document.querySelector('.pf-v6-c-menu');
  expect(root).toHaveClass('lw-c-menu');
  expect(root).toHaveClass('lw-menu-test');
});
it('lets children passthrough win over items', async () => {
  const user = userEvent.setup();
  render(
    <LwMenu label='Actions' items={[{ id: 'hidden', children: 'Hidden' }]}>
      <button type='button'>Custom interior</button>
    </LwMenu>,
  );

  await user.click(screen.getByRole('button', { name: 'Actions' }));

  expect(screen.getByRole('button', { name: 'Custom interior' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'Hidden' })).not.toBeInTheDocument();
});

it('renders a field label on a labeled group without stealing the toggle name', () => {
  render(
    <LwMenu
      fieldLabel='Customer ID'
      label='Select customer ID'
      items={[{ id: 'a', children: 'A' }]}
    />,
  );

  const toggle = screen.getByRole('button', { name: 'Select customer ID' });
  const group = screen.getByRole('group', { name: 'Customer ID' });
  expect(group).toContainElement(toggle);
  expect(group).toHaveClass('lw-c-menu-group');
  expect(screen.getByText('Customer ID')).toBeInTheDocument();
});

it('passes toggleProps through to the harness-built MenuToggle', () => {
  render(
    <LwMenu
      label='Export'
      toggleProps={{ variant: 'secondary', ouiaId: 'export-toggle' }}
      items={[{ id: 'a', children: 'A' }]}
    />,
  );

  const toggle = screen.getByRole('button', { name: 'Export' });
  expect(toggle).toHaveClass('pf-m-secondary');
  expect(toggle).toHaveAttribute('data-ouia-component-id', 'export-toggle');
});

it('applies pf-m-display-lg when toggleProps.size is lg (PF MenuToggle gap fill)', () => {
  render(
    <LwMenu
      label='Export'
      toggleProps={{ size: 'lg', variant: 'secondary' }}
      items={[{ id: 'a', children: 'A' }]}
    />,
  );

  const toggle = screen.getByRole('button', { name: 'Export' });
  expect(toggle).toHaveClass('pf-m-display-lg');
  expect(toggle).toHaveClass('pf-m-secondary');
  expect(toggle).not.toHaveClass('pf-m-small');
});
