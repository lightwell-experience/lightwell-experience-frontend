import { render, screen } from '@testing-library/react';
import { ListItem } from '@patternfly/react-core';

import { LwList } from './list';

it('builds rows from items on the PF List host', () => {
  render(
    <LwList
      items={[
        { id: 'a', children: 'First' },
        { id: 'b', children: 'Second' },
      ]}
    />,
  );

  const host = screen.getByRole('list');
  expect(host).toHaveClass('lw-c-list');
  expect(host).toHaveClass('pf-v6-c-list');
  expect(screen.getByText('First')).toBeInTheDocument();
  expect(screen.getByText('Second')).toBeInTheDocument();
});

it('prefers children passthrough over items', () => {
  render(
    <LwList items={[{ children: 'Ignored' }]}>
      <ListItem>Passthrough body</ListItem>
    </LwList>,
  );

  expect(screen.getByText('Passthrough body')).toBeInTheDocument();
  expect(screen.queryByText('Ignored')).not.toBeInTheDocument();
});
