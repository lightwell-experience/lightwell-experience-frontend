import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import SubmissionsTable, { calculatePageAfterDelete } from './SubmissionsTable';
import {
  useDeleteSubmissionMutation,
  useSubmissionsListQuery,
} from 'services/Lightwell/ClearinghouseQueries';

jest.mock('services/Lightwell/ClearinghouseQueries');
const mockedList = useSubmissionsListQuery as jest.Mock;
const mockedDelete = useDeleteSubmissionMutation as jest.Mock;
const mockDeleteMutate = jest.fn();

const mockNotify = jest.fn();
jest.mock('Hooks/useNotification', () => () => ({ notify: mockNotify }));

const ON = { enabled: true, accessible: true };
let mockFeatures: Record<string, { enabled: boolean; accessible: boolean }> = {
  lightwellclearinghouse: ON,
  lightwellclearinghouseread: ON,
};
jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({ features: mockFeatures }),
}));

let mockCurrentUsername: string | undefined;
jest.mock('../hooks/useCurrentUsername', () => ({
  useCurrentUsername: () => mockCurrentUsername,
}));

const mockDownloadArchive = jest.fn();
jest.mock('services/Lightwell/ClearinghouseApi', () => ({
  downloadSubmissionArchive: (...args: unknown[]) => {
    mockDownloadArchive(...args);
    return Promise.resolve();
  },
}));

jest.mock('./SubmissionDetails', () => ({
  __esModule: true,
  default: ({ uuid }: { uuid: string }) => <div>Detail for {uuid}</div>,
}));

const renderWithRouter = (route = '/') =>
  render(<SubmissionsTable />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    ),
  });

const submission = {
  uuid: 'sub-1',
  status: 'pending',
  created_at: '2026-10-20T10:00:00Z',
  username: 'author@example.com',
  name: 'RHOSE-4.9.json',
  files: [{ uuid: 'f-0', filename: 'submission.json' }],
};

const buildQuery = (overrides = {}) => ({
  data: { data: [submission], meta: { count: 1, limit: 20, offset: 0 } },
  isLoading: false,
  isError: false,
  error: undefined,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUsername = undefined;
  mockFeatures = { lightwellclearinghouse: ON, lightwellclearinghouseread: ON };
  mockedList.mockReturnValue(buildQuery());
  mockedDelete.mockReturnValue({ mutate: mockDeleteMutate, isPending: false });
});

describe('SubmissionsTable', () => {
  it('renders the section title', () => {
    renderWithRouter();

    expect(screen.getByText('Submissions')).toBeInTheDocument();
  });

  it('renders a row per submission with filename, status, created date and author', () => {
    renderWithRouter();

    expect(screen.getByText('RHOSE-4.9.json')).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText('20 Oct 2026')).toBeInTheDocument();
    expect(screen.getByText(/author@example.com/)).toBeInTheDocument();
  });

  it('omits "by <name>" in a row when the author is the current user, keeping the date', () => {
    mockCurrentUsername = 'author@example.com';
    renderWithRouter();

    expect(screen.getByText('20 Oct 2026')).toBeInTheDocument();
    expect(screen.queryByText(/by author@example.com/)).not.toBeInTheDocument();
  });

  it('shows the processed date and processor for a processed submission', () => {
    mockedList.mockReturnValue(
      buildQuery({
        data: {
          data: [
            {
              ...submission,
              status: 'processed',
              processed_at: '2026-10-22T09:30:00Z',
              processed_by: 'tam@example.com',
            },
          ],
          meta: { count: 1 },
        },
      }),
    );
    renderWithRouter();

    expect(screen.getByRole('columnheader', { name: 'Processed' })).toBeInTheDocument();
    expect(screen.getByText('22 Oct 2026')).toBeInTheDocument();
    expect(screen.getByText(/tam@example.com/)).toBeInTheDocument();
  });

  it('shows the submitted date and submitter for a submitted submission', () => {
    mockedList.mockReturnValue(
      buildQuery({
        data: {
          data: [
            {
              ...submission,
              status: 'submitted',
              submitted_at: '2026-10-21T08:15:00Z',
              submitted_by: 'submitter@example.com',
            },
          ],
          meta: { count: 1 },
        },
      }),
    );
    renderWithRouter();

    expect(screen.getByRole('columnheader', { name: 'Submitted' })).toBeInTheDocument();
    expect(screen.getByText('21 Oct 2026')).toBeInTheDocument();
    expect(screen.getByText(/submitter@example.com/)).toBeInTheDocument();
  });

  it('shows dashes for the submitted/processed columns when not yet set', () => {
    renderWithRouter();

    // The pending submission has no submitted/processed info, so those cells are dashes.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a short one-sentence empty state when there are no submissions', () => {
    mockedList.mockReturnValue(buildQuery({ data: { data: [], meta: { count: 0 } } }));
    renderWithRouter();

    expect(
      screen.getByText(
        'No submissions yet. Submit a vulnerability findings JSON payload to see it listed here.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('RHOSE-4.9.json')).not.toBeInTheDocument();
  });

  it('does not show the empty state when the current page is empty but the total count is positive', () => {
    // A later page can return no rows right after its last row is deleted while
    // earlier pages still have rows: emptiness is derived from the count, so the
    // empty state stays hidden and the pagination remains available.
    mockedList.mockReturnValue(buildQuery({ data: { data: [], meta: { count: 25 } } }));
    renderWithRouter();

    expect(
      screen.queryByText(
        'No submissions yet. Submit a vulnerability findings JSON payload to see it listed here.',
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
  });

  it('shows a reader-oriented empty state for read-only users', () => {
    mockFeatures = { lightwellclearinghouseread: ON };
    mockedList.mockReturnValue(buildQuery({ data: { data: [], meta: { count: 0 } } }));
    renderWithRouter();

    expect(
      screen.getByText(
        "No submissions yet. Submissions from customers will appear here once they're received.",
      ),
    ).toBeInTheDocument();
  });

  it('opens the submission drawer with SubmissionDetails when a filename is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    expect(screen.queryByText('Detail for sub-1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'RHOSE-4.9.json' }));

    expect(await screen.findByText('Detail for sub-1')).toBeInTheDocument();
  });

  it('opens the drawer on load when the submission URL param is already set', () => {
    renderWithRouter('/?submission=sub-1');

    expect(screen.getByText('Detail for sub-1')).toBeInTheDocument();
  });

  it('renders a skeleton while loading', () => {
    mockedList.mockReturnValue(buildQuery({ isLoading: true, data: undefined }));
    renderWithRouter();

    expect(screen.getByTestId('beacon-submissions-skeleton')).toBeInTheDocument();
  });

  it('renders an inline error alert on fetch failure without throwing', () => {
    mockedList.mockReturnValue(
      buildQuery({ isError: true, error: new Error('boom'), data: undefined }),
    );

    expect(() => renderWithRouter()).not.toThrow();
    expect(screen.getByText(/Could not load submissions/i)).toBeInTheDocument();
  });

  it('shows a delete action for a pending submission the author can manage', () => {
    mockCurrentUsername = 'author@example.com';
    renderWithRouter();

    expect(screen.getByRole('button', { name: /Delete RHOSE-4.9.json/i })).toBeInTheDocument();
    // Download is read-only on submitted/processed, so a pending row has none.
    expect(
      screen.queryByRole('button', { name: /Download RHOSE-4.9.json/i }),
    ).not.toBeInTheDocument();
  });

  it('hides the delete action on a pending submission from a non-author', () => {
    mockCurrentUsername = 'someone-else@example.com';
    renderWithRouter();

    expect(
      screen.queryByRole('button', { name: /Delete RHOSE-4.9.json/i }),
    ).not.toBeInTheDocument();
  });

  it('shows a download action for a processed submission but no delete', () => {
    mockedList.mockReturnValue(
      buildQuery({ data: { data: [{ ...submission, status: 'processed' }], meta: { count: 1 } } }),
    );
    renderWithRouter();

    expect(screen.getByRole('button', { name: /Download RHOSE-4.9.json/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Delete RHOSE-4.9.json/i }),
    ).not.toBeInTheDocument();
  });

  it('hides download actions from users without the read feature', () => {
    mockFeatures = { lightwellclearinghouse: ON };
    mockedList.mockReturnValue(
      buildQuery({ data: { data: [{ ...submission, status: 'processed' }], meta: { count: 1 } } }),
    );
    renderWithRouter();

    expect(
      screen.queryByRole('button', { name: /Download RHOSE-4.9.json/i }),
    ).not.toBeInTheDocument();
  });

  it('hides the action column entirely when no row supports an action', () => {
    // No features: the user can neither delete nor download anything.
    mockFeatures = {};
    renderWithRouter();

    expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Download RHOSE-4.9.json/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Delete RHOSE-4.9.json/i }),
    ).not.toBeInTheDocument();
  });

  it('downloads the whole submission as an archive from the row action', async () => {
    mockedList.mockReturnValue(
      buildQuery({ data: { data: [{ ...submission, status: 'processed' }], meta: { count: 1 } } }),
    );
    const user = userEvent.setup();
    renderWithRouter();

    await user.click(screen.getByRole('button', { name: /Download RHOSE-4.9.json/i }));

    expect(mockDownloadArchive).toHaveBeenCalledWith('sub-1');
  });

  it('deletes a submission only after confirming', async () => {
    mockCurrentUsername = 'author@example.com';
    const user = userEvent.setup();
    renderWithRouter();

    await user.click(screen.getByRole('button', { name: /Delete RHOSE-4.9.json/i }));
    expect(mockDeleteMutate).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete all' }));

    expect(mockDeleteMutate).toHaveBeenCalledWith('sub-1', expect.any(Object));
  });
});

describe('calculatePageAfterDelete', () => {
  it('keeps the current page when nothing was deleted', () => {
    expect(calculatePageAfterDelete(3, 20, 50, 0)).toBe(3);
  });

  it('clamps to the last remaining page when the current page becomes empty', () => {
    // Deleting the only row on page 2 (21 total, 20 per page) leaves one full page.
    expect(calculatePageAfterDelete(2, 20, 21, 1)).toBe(1);
  });

  it('stays on the current page when it still holds rows after deletion', () => {
    expect(calculatePageAfterDelete(2, 20, 41, 1)).toBe(2);
  });

  it('never returns a page below 1, even when every row is deleted', () => {
    expect(calculatePageAfterDelete(1, 20, 1, 1)).toBe(1);
  });
});
