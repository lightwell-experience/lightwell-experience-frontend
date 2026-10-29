import { render } from '@testing-library/react';
import { JavaIcon } from '@patternfly/react-icons';

import { LwIcon } from './icon';

it('merges kit host class onto the PF Icon root', () => {
  const { container } = render(
    <LwIcon size='3xl'>
      <JavaIcon />
    </LwIcon>,
  );

  const host = container.querySelector('.lw-c-icon');
  expect(host).toBeTruthy();
  expect(host).toHaveClass('pf-v6-c-icon');
  expect(host).toHaveClass('pf-m-3xl');
});
