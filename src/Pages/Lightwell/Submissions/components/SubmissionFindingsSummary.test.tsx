import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SubmissionFindingsSummary, { describeFindings } from './SubmissionFindingsSummary';

const zero = { total: 0, emails: 0, home_usernames: 0, credentials: 0, ip_addresses: 0 };

describe('describeFindings', () => {
  it('lists only non-zero kinds with pluralization', () => {
    expect(
      describeFindings({
        total: 5,
        emails: 2,
        home_usernames: 1,
        credentials: 1,
        ip_addresses: 1,
      }),
    ).toBe('2 email addresses, 1 username in file paths, 1 credential, 1 IP address');
    expect(describeFindings({ ...zero, total: 3, credentials: 3 })).toBe('3 credentials');
  });
});

describe('SubmissionFindingsSummary', () => {
  it('invites a review without claiming anything was removed', () => {
    render(
      <SubmissionFindingsSummary summary={{ ...zero, total: 3, emails: 2, ip_addresses: 1 }} />,
    );

    expect(
      screen.getByText('3 possible sensitive items found — review before submitting'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/removed|clean|anonymi[sz]ed/i)).not.toBeInTheDocument();
  });

  it('uses the singular for one finding', () => {
    render(<SubmissionFindingsSummary summary={{ ...zero, total: 1, credentials: 1 }} />);

    expect(screen.getByText(/^1 possible sensitive item found/)).toBeInTheDocument();
  });

  it('shows the breakdown and the limits of automatic detection in a popover', async () => {
    const user = userEvent.setup();
    render(
      <SubmissionFindingsSummary summary={{ ...zero, total: 3, emails: 2, ip_addresses: 1 }} />,
    );

    await user.click(screen.getByRole('button', { name: 'Learn more' }));

    expect(await screen.findByText('Found: 2 email addresses, 1 IP address.')).toBeInTheDocument();
    expect(screen.getByText(/your STAM reviews it first and scrubs/i)).toBeInTheDocument();
    expect(screen.getByText(/Your report is not changed/)).toBeInTheDocument();
    expect(screen.getByText(/cannot find everything/i)).toBeInTheDocument();
  });
});
