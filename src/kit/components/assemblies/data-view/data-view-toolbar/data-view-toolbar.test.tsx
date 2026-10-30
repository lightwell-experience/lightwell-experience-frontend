import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LwDataViewToolbar } from './data-view-toolbar';
import { LwDataView } from '../data-view';

describe('search ownership', () => {
  it('renders SearchInput from data props when search is provided', () => {
    render(
      <LwDataViewToolbar
        search={{ value: 'test', onChange: () => {}, placeholder: 'Search items...' }}
      />,
    );

    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
  });

  it('does not render search when search is omitted', () => {
    render(<LwDataViewToolbar filters={<div>Filters</div>} />);

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('does not render search when search is false', () => {
    render(<LwDataViewToolbar search={false} filters={<div>Filters</div>} />);

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('calls onChange when search input changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(
      <LwDataViewToolbar
        search={{ value: '', onChange: handleChange, placeholder: 'Search...' }}
      />,
    );

    await user.type(screen.getByPlaceholderText('Search...'), 'a');
    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('calls onClear when search is cleared', async () => {
    const user = userEvent.setup();
    const handleClear = jest.fn();

    render(
      <LwDataViewToolbar
        search={{
          value: 'query',
          onChange: () => {},
          onClear: handleClear,
          placeholder: 'Search...',
        }}
      />,
    );

    const clearButton = screen.getByLabelText('Reset');
    await user.click(clearButton);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});

describe('pagination ownership', () => {
  it('renders Pagination from data props when pagination is provided', () => {
    render(
      <LwDataViewToolbar
        pagination={{
          itemCount: 100,
          page: 1,
          perPage: 20,
          onSetPage: () => {},
          onPerPageSelect: () => {},
        }}
      />,
    );

    const paginationItem = document.querySelector('.pf-m-pagination');
    expect(paginationItem).toBeInTheDocument();
    expect(paginationItem?.querySelector('.pf-v6-c-pagination')).toBeInTheDocument();
  });

  it('does not render pagination when omitted', () => {
    render(<LwDataViewToolbar search={{ value: '', onChange: () => {} }} />);

    expect(document.querySelector('.pf-m-pagination')).not.toBeInTheDocument();
  });

  it('does not render pagination when false', () => {
    render(<LwDataViewToolbar pagination={false} />);

    expect(document.querySelector('.pf-m-pagination')).not.toBeInTheDocument();
  });

  it('wraps pagination in an end-aligned ToolbarItem', () => {
    render(
      <LwDataViewToolbar
        pagination={{
          itemCount: 50,
          page: 1,
          perPage: 10,
          onSetPage: () => {},
          onPerPageSelect: () => {},
        }}
      />,
    );

    const paginationItem = document.querySelector('.pf-m-pagination');
    expect(paginationItem).toHaveClass('pf-m-align-end');
  });
});

describe('panel toggle', () => {
  it('renders toggle button when panelToggle is provided', () => {
    render(
      <LwDataViewToolbar
        panelToggle={{ isExpanded: false, onToggle: () => {}, label: 'Filters' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
  });

  it('does not render toggle button when panelToggle is omitted', () => {
    render(<LwDataViewToolbar />);

    expect(screen.queryByRole('button', { name: 'Toggle filters' })).not.toBeInTheDocument();
  });

  it('calls onToggle when toggle button is clicked', async () => {
    const user = userEvent.setup();
    const handleToggle = jest.fn();

    render(
      <LwDataViewToolbar
        panelToggle={{ isExpanded: false, onToggle: handleToggle, label: 'Filters' }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('sets aria-expanded based on isExpanded', () => {
    render(
      <LwDataViewToolbar
        panelToggle={{ isExpanded: true, onToggle: () => {}, label: 'Filters' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});

describe('manageColumns', () => {
  const tableProps = {
    columns: [{ cell: 'Name' }],
    rows: [{ id: '1', row: [{ cell: 'Row' }] }],
    manageColumns: {
      columns: [{ cell: 'Name', key: 'name', isShown: true, isShownByDefault: true }],
      onApply: jest.fn(),
      onReset: jest.fn(),
    },
  };

  it('renders Manage columns button when manageColumns is true and parent LwDataView has manageColumns', () => {
    render(
      <LwDataView aria-label='Table' {...tableProps}>
        <LwDataViewToolbar manageColumns />
      </LwDataView>,
    );

    expect(screen.getByRole('button', { name: 'Manage columns' })).toBeInTheDocument();
  });

  it('does not render Manage columns button when manageColumns prop is absent', () => {
    render(
      <LwDataView aria-label='Table' {...tableProps}>
        <LwDataViewToolbar />
      </LwDataView>,
    );

    expect(screen.queryByRole('button', { name: 'Manage columns' })).not.toBeInTheDocument();
  });

  it('does not render Manage columns button when toolbar has manageColumns but parent LwDataView does not', () => {
    render(
      <LwDataView aria-label='Table' columns={tableProps.columns} rows={tableProps.rows}>
        <LwDataViewToolbar manageColumns />
      </LwDataView>,
    );

    expect(screen.queryByRole('button', { name: 'Manage columns' })).not.toBeInTheDocument();
  });

  it('opens the modal when Manage columns is clicked', async () => {
    const user = userEvent.setup();

    render(
      <LwDataView aria-label='Table' {...tableProps}>
        <LwDataViewToolbar manageColumns />
      </LwDataView>,
    );

    await user.click(screen.getByRole('button', { name: 'Manage columns' }));
    expect(screen.getByRole('dialog', { name: /manage columns/i })).toBeInTheDocument();
  });
});

describe('canonical slot order', () => {
  it('renders search, then filters, then actions, then pagination in DOM order', () => {
    render(
      <LwDataViewToolbar
        search={{ value: '', onChange: () => {}, placeholder: 'Search...' }}
        filters={<div data-ouia-component-id='filters'>Filters</div>}
        actions={<button type='button'>Manage columns</button>}
        pagination={{
          itemCount: 100,
          page: 1,
          perPage: 20,
          onSetPage: () => {},
          onPerPageSelect: () => {},
        }}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    const filters = screen.getByTestId('filters');
    const actions = screen.getByRole('button', { name: 'Manage columns' });
    const pagination = document.querySelector('.pf-m-pagination') as HTMLElement;

    expect(searchInput.compareDocumentPosition(filters)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(filters.compareDocumentPosition(actions)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(actions.compareDocumentPosition(pagination)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('renders children between panelToggle and pagination', () => {
    render(
      <LwDataViewToolbar
        panelToggle={{ isExpanded: false, onToggle: () => {}, label: 'Filters' }}
        pagination={{
          itemCount: 50,
          page: 1,
          perPage: 10,
          onSetPage: () => {},
          onPerPageSelect: () => {},
        }}
      >
        <div data-ouia-component-id='custom-child'>Custom</div>
      </LwDataViewToolbar>,
    );

    const toggle = screen.getByRole('button', { name: 'Filters' });
    const customChild = screen.getByTestId('custom-child');
    const pagination = document.querySelector('.pf-m-pagination') as HTMLElement;

    expect(toggle.compareDocumentPosition(customChild)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(customChild.compareDocumentPosition(pagination)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
