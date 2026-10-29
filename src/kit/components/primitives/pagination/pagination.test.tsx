import { render } from '@testing-library/react';

import { LwPagination } from './pagination';

it('renders a PF Pagination with lw-c-pagination class', () => {
  const { container } = render(
    <LwPagination
      itemCount={100}
      page={1}
      perPage={20}
      onSetPage={() => {}}
      onPerPageSelect={() => {}}
    />,
  );

  const pagination = container.querySelector('.pf-v6-c-pagination');
  expect(pagination).toBeInTheDocument();
  expect(pagination).toHaveClass('lw-c-pagination');
});

it('merges call-site className', () => {
  const { container } = render(
    <LwPagination
      itemCount={50}
      page={1}
      perPage={10}
      onSetPage={() => {}}
      onPerPageSelect={() => {}}
      className='custom-pagination'
    />,
  );

  const pagination = container.querySelector('.pf-v6-c-pagination');
  expect(pagination).toHaveClass('lw-c-pagination');
  expect(pagination).toHaveClass('custom-pagination');
});
