import { render } from '@testing-library/react';
import EmptyTableState from './EmptyTableState';

it('Empty Lightwell state shows expected content', () => {
  const { queryByText } = render(<EmptyTableState />);

  expect(queryByText('Lightwell members only')).toBeInTheDocument();
  expect(queryByText('Not a member? Get started')).toBeInTheDocument();
});
