import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PublishedVersions } from './PublishedVersions';

describe('PublishedVersions', () => {
  it('renders nothing when there are no published versions', () => {
    const { container } = render(<PublishedVersions versions={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders one version without an overflow control', () => {
    render(<PublishedVersions versions={['1.10.0.rhlw-00001']} />);

    expect(screen.getByText('1.10.0.rhlw-00001')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /more published versions/i }),
    ).not.toBeInTheDocument();
  });

  it('reveals additional versions in a popover', async () => {
    render(
      <PublishedVersions
        versions={['1.10.2.rhlw-00003', '1.10.1.rhlw-00002', '1.10.0.rhlw-00001']}
      />,
    );

    expect(screen.getByText('1.10.2.rhlw-00003')).toBeInTheDocument();
    expect(screen.queryByText('1.10.1.rhlw-00002')).not.toBeInTheDocument();

    const overflowButton = screen.getByRole('button', { name: 'Show 2 more published versions' });
    overflowButton.focus();
    fireEvent.click(overflowButton);

    expect(screen.getByRole('dialog', { name: 'Other published versions' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('list', { name: 'Additional published versions' })).toHaveFocus(),
    );
    expect(screen.getByText('1.10.1.rhlw-00002')).toBeInTheDocument();
    expect(screen.getByText('1.10.0.rhlw-00001')).toBeInTheDocument();
  });
});
