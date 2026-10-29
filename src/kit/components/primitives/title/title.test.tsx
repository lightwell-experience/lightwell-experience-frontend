import { render, screen } from '@testing-library/react';

import { componentsConfig } from 'kit/components/components.config';
import { LwTitle } from './title';

it('renders an h1 that ingests configured size for that level', () => {
  const { container } = render(<LwTitle headingLevel='h1'>Repositories</LwTitle>);
  const heading = screen.getByRole('heading', { level: 1, name: 'Repositories' });
  const configuredSize = componentsConfig.title.sizes?.h1;

  expect(heading).toHaveClass('lw-c-title');
  expect(configuredSize).toBeTruthy();
  expect(container.querySelector(`.pf-m-${configuredSize}`)).toBe(heading);
});

it('lets call-site size win over the level map', () => {
  const { container } = render(
    <LwTitle headingLevel='h1' size='xl'>
      Override
    </LwTitle>,
  );

  expect(container.querySelector('.pf-m-xl')).toHaveTextContent('Override');
  expect(container.querySelector('.pf-m-3xl')).toBeNull();
});
