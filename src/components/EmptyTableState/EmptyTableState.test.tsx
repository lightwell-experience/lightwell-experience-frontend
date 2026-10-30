import { render } from '@testing-library/react';
import { ReactQueryTestWrapper } from 'testingHelpers';
import EmptyTableState from './EmptyTableState';
import { Button } from '@patternfly/react-core';

jest.mock('Hooks/useNotification', () => () => ({ notify: () => null }));

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({}),
}));

it('Render with notFiltered is set to "true"', () => {
  const item = 'custom repositories';
  const body = 'To get started, create a custom repository.';
  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <EmptyTableState
        notFiltered
        clearFilters={() => null}
        itemName={item}
        notFilteredBody={body}
        notFilteredButton={<Button>Add Content</Button>}
      />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText(`No ${item}`)).toBeInTheDocument();
  expect(queryByText(body)).toBeInTheDocument();
});

it('Render with notFiltered is set to "false"', () => {
  const item = 'tasks';
  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <EmptyTableState notFiltered={false} clearFilters={() => null} itemName={item} />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText(`No ${item} match the filter criteria`)).toBeInTheDocument();
  expect(queryByText('Clear all filters to show more results.')).toBeInTheDocument();
  expect(queryByText('Clear all filters')).toBeInTheDocument();
});

it('Render with notFiltered set to "true" without notFilteredBody and notFilteredButton', () => {
  const item = 'tasks';
  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <EmptyTableState notFiltered clearFilters={() => null} itemName={item} />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText(`No ${item}`)).toBeInTheDocument();
});
