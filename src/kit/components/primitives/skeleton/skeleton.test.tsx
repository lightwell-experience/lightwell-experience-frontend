import { render } from '@testing-library/react';

import { LwSkeleton } from './skeleton';

it('harnesses the Skeleton root with height passthrough', () => {
  const { container } = render(<LwSkeleton height='120px' />);
  const host = container.querySelector('.pf-v6-c-skeleton');

  expect(host).toHaveClass('lw-c-skeleton');
  // PF maps `height` onto --pf-v6-c-skeleton--Height (not inline height).
  expect(host).toHaveStyle({ '--pf-v6-c-skeleton--Height': '120px' });
});
