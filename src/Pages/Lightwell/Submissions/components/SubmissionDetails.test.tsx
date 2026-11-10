import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SubmissionDetails from './SubmissionDetails';
import { useSubmissionDetail } from '../hooks/useSubmissionDetail';

jest.mock('../hooks/useSubmissionDetail');
const mockedHook = useSubmissionDetail as jest.Mock;

let mockCurrentUsername: string | undefined;
jest.mock('../hooks/useCurrentUsername', () => ({
  useCurrentUsername: () => mockCurrentUsername,
}));

type BuildHookOptions = Record<string, unknown> & {
  /** Per-file `can_delete` applied to every file. */
  fileCanDelete?: boolean;
  /** Per-file `can_download` applied to every file. */
  fileCanDownload?: boolean;
};

const buildHook = ({
  fileCanDelete = true,
  fileCanDownload = true,
  ...overrides
}: BuildHookOptions = {}) => ({
  submission: {
    uuid: 'sub-1',
    status: 'pending',
    created_at: '2026-10-20T10:00:00Z',
    username: 'author@example.com',
    name: 'RHOSE-4.9.json',
  },
  isLoading: false,
  isError: false,
  canAddReproducers: true,
  canDelete: true,
  canSubmit: true,
  canProcess: false,
  canDownload: true,
  mainFile: {
    uuid: 'f-0',
    filename: 'RHOSE-4.9.json',
    can_delete: fileCanDelete,
    can_download: fileCanDownload,
  },
  reproducerFiles: [
    {
      uuid: 'f-1',
      filename: 'repro.jpg',
      username: 'author@example.com',
      created_at: '2026-10-20T10:05:00Z',
      can_delete: fileCanDelete,
      can_download: fileCanDownload,
    },
    {
      uuid: 'f-2',
      filename: 'trace.log',
      username: 'helper@example.com',
      created_at: '2026-10-20T10:06:00Z',
      can_delete: fileCanDelete,
      can_download: fileCanDownload,
    },
  ],
  addFiles: jest.fn(),
  deleteFile: jest.fn(),
  deleteWholeSubmission: jest.fn(),
  submit: jest.fn(),
  process: jest.fn(),
  download: jest.fn(),
  downloadArchive: jest.fn(),
  isAddingFiles: false,
  addingCount: 0,
  isMutating: false,
  isSubmitting: false,
  isProcessing: false,
  isDownloadingArchive: false,
  ...overrides,
});

const confirmInDialog = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name }));
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUsername = undefined;
  mockedHook.mockReturnValue(buildHook());
});

describe('SubmissionDetails', () => {
  it('lists reproducer files with a success note each', () => {
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.getByText('repro.jpg')).toBeInTheDocument();
    expect(screen.getByText('trace.log')).toBeInTheDocument();
    expect(screen.getAllByText(/successfully uploaded/i)).toHaveLength(2);
    expect(
      screen.getByText('Successfully uploaded by author@example.com at 20 Oct 2026'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Successfully uploaded by helper@example.com at 20 Oct 2026'),
    ).toBeInTheDocument();
  });

  it('omits "by <name>" for files the current user uploaded, keeping the date', () => {
    mockCurrentUsername = 'author@example.com';
    render(<SubmissionDetails uuid='sub-1' />);

    // The current user's own file: date only, no "by author@example.com".
    expect(screen.getByText('Successfully uploaded at 20 Oct 2026')).toBeInTheDocument();
    expect(
      screen.queryByText('Successfully uploaded by author@example.com at 20 Oct 2026'),
    ).not.toBeInTheDocument();
    // Someone else's file still shows the uploader.
    expect(
      screen.getByText('Successfully uploaded by helper@example.com at 20 Oct 2026'),
    ).toBeInTheDocument();
  });

  it('shows the filename, status, the per-file download, and the archive download', () => {
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.getByText('Filename')).toBeInTheDocument();
    expect(screen.getByText('RHOSE-4.9.json')).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download RHOSE-4.9.json/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download all' })).toBeInTheDocument();
  });

  it('downloads the whole submission as an archive when "Download all" is clicked', async () => {
    const downloadArchive = jest.fn();
    mockedHook.mockReturnValue(buildHook({ downloadArchive }));
    const user = userEvent.setup();
    render(<SubmissionDetails uuid='sub-1' />);

    await user.click(screen.getByRole('button', { name: 'Download all' }));

    expect(downloadArchive).toHaveBeenCalledTimes(1);
  });

  it('disables "Download all" and shows a spinner while the archive downloads', () => {
    mockedHook.mockReturnValue(buildHook({ isDownloadingArchive: true }));
    render(<SubmissionDetails uuid='sub-1' />);

    const button = screen.getByRole('button', { name: /Download all/ });
    expect(button).toBeDisabled();
    expect(within(button).getByRole('progressbar')).toBeInTheDocument();
  });

  it('disables Submit without a spinner while another action (e.g. adding files) runs', () => {
    mockedHook.mockReturnValue(buildHook({ isMutating: true }));
    render(<SubmissionDetails uuid='sub-1' />);

    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(submit).toBeDisabled();
    expect(within(submit).queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows a spinner on Submit only while submitting', () => {
    mockedHook.mockReturnValue(buildHook({ isMutating: true, isSubmitting: true }));
    render(<SubmissionDetails uuid='sub-1' />);

    expect(
      within(screen.getByRole('button', { name: /Submit/ })).getByRole('progressbar'),
    ).toBeInTheDocument();
  });

  it('hides the header downloads when the user cannot download', () => {
    mockedHook.mockReturnValue(buildHook({ canDownload: false, fileCanDownload: false }));
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.queryByRole('button', { name: 'Download all' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Download RHOSE-4.9.json/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the submission name instead of the filename when the user cannot download', () => {
    mockedHook.mockReturnValue(
      buildHook({
        canDownload: false,
        submission: { ...buildHook().submission, name: 'My submission' },
        mainFile: {
          uuid: 'f-0',
          filename: 'secret-internal.json',
          can_delete: false,
          can_download: false,
        },
      }),
    );
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.getByText('My submission')).toBeInTheDocument();
    expect(screen.queryByText('secret-internal.json')).not.toBeInTheDocument();
  });

  it('shows skeleton rows while reproducers are uploading', () => {
    mockedHook.mockReturnValue(buildHook({ isAddingFiles: true, addingCount: 2 }));
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.getAllByText('Uploading reproducer file')).toHaveLength(2);
  });

  it('shows a reproducers title with the count', () => {
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.getByText('Reproducers (2)')).toBeInTheDocument();
  });

  it('shows an empty state when there are no reproducers', () => {
    mockedHook.mockReturnValue(buildHook({ reproducerFiles: [] }));
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.getByText(/No reproducer files/i)).toBeInTheDocument();
  });

  it('shows the footer edit controls plus per-row download and delete when permitted', () => {
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.getByRole('button', { name: 'Add more reproducers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download repro.jpg/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete repro.jpg/i })).toBeInTheDocument();
  });

  it('lets a non-author write user add reproducers but hides submit/delete controls', () => {
    // The backend allows adding reproducers but not deleting/submitting (not the author).
    mockedHook.mockReturnValue(
      buildHook({
        canAddReproducers: true,
        canDelete: false,
        canSubmit: false,
        fileCanDelete: false,
      }),
    );
    render(<SubmissionDetails uuid='sub-1' />);

    // Adding reproducers stays available to any write user while pending.
    expect(screen.getByRole('button', { name: 'Add more reproducers' })).toBeInTheDocument();
    // Author-only controls are hidden.
    expect(screen.queryByRole('button', { name: 'Delete all' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete repro.jpg/i })).not.toBeInTheDocument();
  });

  it('shows only downloads for a read-only viewer who cannot edit or process', () => {
    mockedHook.mockReturnValue(
      buildHook({
        canAddReproducers: false,
        canDelete: false,
        canSubmit: false,
        canProcess: false,
        fileCanDelete: false,
      }),
    );
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.queryByRole('button', { name: 'Add more reproducers' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete all' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark as processed' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete repro.jpg/i })).not.toBeInTheDocument();
    // Downloads remain: the footer "Download all" and the per-row download.
    expect(screen.getByRole('button', { name: 'Download all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download repro.jpg/i })).toBeInTheDocument();
  });

  it('hides the footer entirely when no edit/process/download actions are available', () => {
    mockedHook.mockReturnValue(
      buildHook({
        canAddReproducers: false,
        canDelete: false,
        canSubmit: false,
        canProcess: false,
        canDownload: false,
        fileCanDelete: false,
        fileCanDownload: false,
      }),
    );
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.queryByRole('button', { name: 'Add more reproducers' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete all' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark as processed' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download all' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Download repro.jpg/i })).not.toBeInTheDocument();
  });

  it('shows "Mark as processed" in the footer when canProcess', () => {
    mockedHook.mockReturnValue(
      buildHook({ canAddReproducers: false, canDelete: false, canSubmit: false, canProcess: true }),
    );
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.getByRole('button', { name: 'Mark as processed' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('hides all per-row download buttons when the user cannot download', () => {
    mockedHook.mockReturnValue(buildHook({ canDownload: false, fileCanDownload: false }));
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.queryByRole('button', { name: /Download repro.jpg/i })).not.toBeInTheDocument();
  });

  it("gates each reproducer's download/delete on that file's own flags", () => {
    const [repro, trace] = buildHook().reproducerFiles;
    mockedHook.mockReturnValue(
      buildHook({
        reproducerFiles: [
          { ...repro, can_delete: false, can_download: true },
          { ...trace, can_delete: true, can_download: false },
        ],
      }),
    );
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.getByRole('button', { name: /Download repro.jpg/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete repro.jpg/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Download trace.log/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete trace.log/i })).toBeInTheDocument();
  });

  it('downloads a reproducer when its download button is clicked', async () => {
    const download = jest.fn();
    mockedHook.mockReturnValue(buildHook({ download }));
    const user = userEvent.setup();
    render(<SubmissionDetails uuid='sub-1' />);

    await user.click(screen.getByRole('button', { name: /Download trace.log/i }));

    expect(download).toHaveBeenCalledWith('trace.log');
  });

  it('deletes a single reproducer only after confirming', async () => {
    const deleteFile = jest.fn();
    mockedHook.mockReturnValue(buildHook({ deleteFile }));
    const user = userEvent.setup();
    render(<SubmissionDetails uuid='sub-1' />);

    await user.click(screen.getByRole('button', { name: /Delete repro.jpg/i }));
    expect(deleteFile).not.toHaveBeenCalled();

    await confirmInDialog(user, 'Delete');
    expect(deleteFile).toHaveBeenCalledWith('repro.jpg');
  });

  it('adds more reproducers through the hidden upload input', async () => {
    const addFiles = jest.fn();
    mockedHook.mockReturnValue(buildHook({ addFiles }));
    const user = userEvent.setup();
    render(<SubmissionDetails uuid='sub-1' />);

    const file = new File(['a'], 'extra.png', { type: 'image/png' });
    await user.upload(screen.getByTestId('add-reproducer-file-input'), file);

    expect(addFiles).toHaveBeenCalledWith([file]);
  });

  it('deletes the whole submission only after confirming', async () => {
    const deleteWholeSubmission = jest.fn();
    mockedHook.mockReturnValue(buildHook({ deleteWholeSubmission }));
    const user = userEvent.setup();
    render(<SubmissionDetails uuid='sub-1' />);

    await user.click(screen.getByRole('button', { name: 'Delete all' }));
    expect(deleteWholeSubmission).not.toHaveBeenCalled();

    await confirmInDialog(user, 'Delete all');
    expect(deleteWholeSubmission).toHaveBeenCalledTimes(1);
  });

  it('submits only after confirming', async () => {
    const submit = jest.fn();
    mockedHook.mockReturnValue(buildHook({ submit }));
    const user = userEvent.setup();
    render(<SubmissionDetails uuid='sub-1' />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(submit).not.toHaveBeenCalled();

    await confirmInDialog(user, 'Submit');
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('marks as processed only after confirming', async () => {
    const process = jest.fn();
    mockedHook.mockReturnValue(
      buildHook({
        canAddReproducers: false,
        canDelete: false,
        canSubmit: false,
        canProcess: true,
        process,
      }),
    );
    const user = userEvent.setup();
    render(<SubmissionDetails uuid='sub-1' />);

    await user.click(screen.getByRole('button', { name: 'Mark as processed' }));
    expect(process).not.toHaveBeenCalled();

    await confirmInDialog(user, 'Mark as processed');
    expect(process).toHaveBeenCalledTimes(1);
  });

  it('renders a loading indicator while loading', () => {
    mockedHook.mockReturnValue(buildHook({ isLoading: true, mainFile: undefined }));
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders an error alert on error', () => {
    mockedHook.mockReturnValue(buildHook({ isError: true, mainFile: undefined }));
    render(<SubmissionDetails uuid='sub-1' />);

    expect(screen.getByText(/Could not load the submission/i)).toBeInTheDocument();
  });
});
