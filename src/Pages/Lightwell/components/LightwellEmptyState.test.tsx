import { render, screen } from '@testing-library/react';
import LightwellEmptyState from './LightwellEmptyState';

it('renders empty defaults without displayedItemsName', () => {
  render(<LightwellEmptyState variant='empty' />);

  expect(screen.getByRole('heading', { name: 'No data' })).toBeInTheDocument();
  expect(screen.getByText('Nothing to show yet.')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('renders empty defaults with displayedItemsName', () => {
  render(<LightwellEmptyState variant='empty' displayedItemsName='packages' />);

  expect(screen.getByRole('heading', { name: 'No packages' })).toBeInTheDocument();
  expect(screen.getByText('No packages available yet.')).toBeInTheDocument();
});

it('renders noMatch defaults', () => {
  render(<LightwellEmptyState variant='noMatch' />);

  expect(screen.getByRole('heading', { name: 'No results found' })).toBeInTheDocument();
  expect(
    screen.getByText('No results match the filter criteria. Clear all filters and try again.'),
  ).toBeInTheDocument();
});

it('renders noMatch defaults with displayedItemsName', () => {
  render(<LightwellEmptyState variant='noMatch' displayedItemsName='packages' />);

  expect(screen.getByRole('heading', { name: 'No packages found' })).toBeInTheDocument();
  expect(
    screen.getByText('No packages match the filter criteria. Clear all filters and try again.'),
  ).toBeInTheDocument();
});
