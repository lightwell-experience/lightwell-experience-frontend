import { render, screen } from '@testing-library/react';
import EmptyTableDataView from './EmptyTableDataView';
import { EmptyStateActions, Button } from '@patternfly/react-core';
import { Table } from '@patternfly/react-table';
import userEvent from '@testing-library/user-event';

const itemName = 'repositories';
const colSpan = 6;
const zeroBody = 'To get started, create a custom repository.';
const zeroButtonText = 'Add repositories';

const user = userEvent.setup();

it('should render zero state correctly', async () => {
  const navigate = jest.fn();

  render(
    <Table>
      <EmptyTableDataView
        variant='zero'
        itemName={itemName}
        zeroBody={zeroBody}
        colSpan={colSpan}
        actions={
          <EmptyStateActions>
            <Button onClick={navigate}>{zeroButtonText}</Button>
          </EmptyStateActions>
        }
      />
    </Table>,
  );

  expect(screen.getByText(`No ${itemName}`)).toBeInTheDocument();
  expect(screen.getByText(zeroBody)).toBeInTheDocument();

  const button = screen.getByRole('button', { name: zeroButtonText });
  expect(button).toBeInTheDocument();
  await user.click(button);
  expect(navigate).toHaveBeenCalledTimes(1);
});

it('should render filtered state correctly', async () => {
  const onClearFilters = jest.fn();

  render(
    <Table>
      <EmptyTableDataView itemName={itemName} colSpan={colSpan} onClearFilters={onClearFilters} />
    </Table>,
  );

  expect(screen.getByText(`No ${itemName} match the filter criteria`)).toBeInTheDocument();
  expect(screen.getByText('Clear all filters to show more results.')).toBeInTheDocument();

  const button = screen.getByRole('button', { name: 'Clear all filters' });
  expect(button).toBeInTheDocument();
  await user.click(button);
  expect(onClearFilters).toHaveBeenCalledTimes(1);
});

it('should render zero state with title only when body and actions are not provided', () => {
  render(
    <Table>
      <EmptyTableDataView variant='zero' itemName={itemName} colSpan={colSpan} />
    </Table>,
  );

  expect(screen.getByText(`No ${itemName}`)).toBeInTheDocument();
  expect(screen.queryByText(zeroBody)).not.toBeInTheDocument();
  expect(screen.queryByText(zeroButtonText)).not.toBeInTheDocument();
});
