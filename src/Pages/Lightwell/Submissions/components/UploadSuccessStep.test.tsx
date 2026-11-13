import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UploadSuccessStep from './UploadSuccessStep';
import { useSubmissionDetail } from '../hooks/useSubmissionDetail';
import { useSubmissionDrawerParams } from '../hooks/useSubmissionDrawerParams';
import { usePendingReproducers } from './PendingReproducersContext';

jest.mock('../hooks/useSubmissionDetail');
jest.mock('../hooks/useSubmissionDrawerParams');
jest.mock('./PendingReproducersContext');
const mockedHook = useSubmissionDetail as jest.Mock;
const mockedDrawerParams = useSubmissionDrawerParams as jest.Mock;
const mockedPending = usePendingReproducers as jest.Mock;

const mockOpenSubmission = jest.fn();
const mockSetPending = jest.fn();

const buildHook = (overrides = {}) => ({
  isLoading: false,
  isError: false,
  submission: { uuid: 'sub-1', name: 'RHOSE-4.9.json' },
  mainFile: { uuid: 'f-0', filename: 'submission.json' },
  submit: jest.fn(),
  ...overrides,
});

const confirmInDialog = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name }));
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedHook.mockReturnValue(buildHook());
  mockedDrawerParams.mockReturnValue({ openSubmission: mockOpenSubmission });
  mockedPending.mockReturnValue({ setPending: mockSetPending, takePending: jest.fn() });
});

describe('UploadSuccessStep', () => {
  it('shows the success header with the submission name', () => {
    render(<UploadSuccessStep uuid='sub-1' />);

    expect(screen.getByText('RHOSE-4.9.json')).toBeInTheDocument();
    expect(screen.getByText(/was successfully uploaded and saved/i)).toBeInTheDocument();
  });

  it('does not list reproducer files, a reproducers title, or download/delete controls', () => {
    render(<UploadSuccessStep uuid='sub-1' />);

    expect(screen.queryByText('repro.jpg')).not.toBeInTheDocument();
    expect(screen.queryByText(/Reproducers/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Download/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
  });

  it('renders the upload, "or" divider, and submit controls', () => {
    render(<UploadSuccessStep uuid='sub-1' />);

    expect(
      screen.getByRole('button', { name: 'Upload optional reproducer file(s)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('or')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Submit for structural validation by your STAM' }),
    ).toBeInTheDocument();
  });

  it('stashes selected reproducers, opens the drawer, and notifies the parent', async () => {
    const onOpenedInDrawer = jest.fn();
    const user = userEvent.setup();
    render(<UploadSuccessStep uuid='sub-1' onOpenedInDrawer={onOpenedInDrawer} />);

    const file = new File(['a'], 'extra.png', { type: 'image/png' });
    await user.upload(screen.getByTestId('reproducer-file-input'), file);

    // The upload itself now happens in the drawer; here we only hand off the files.
    expect(mockSetPending).toHaveBeenCalledWith('sub-1', [file]);
    expect(mockOpenSubmission).toHaveBeenCalledWith('sub-1');
    expect(onOpenedInDrawer).toHaveBeenCalledTimes(1);
  });

  it('submits for validation only after confirming', async () => {
    const submit = jest.fn();
    mockedHook.mockReturnValue(buildHook({ submit }));
    const user = userEvent.setup();
    render(<UploadSuccessStep uuid='sub-1' />);

    await user.click(
      screen.getByRole('button', { name: 'Submit for structural validation by your STAM' }),
    );
    expect(submit).not.toHaveBeenCalled();

    await confirmInDialog(user, 'Submit');
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('renders a loading indicator while loading', () => {
    mockedHook.mockReturnValue(buildHook({ isLoading: true, mainFile: undefined }));
    render(<UploadSuccessStep uuid='sub-1' />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders an error alert on error', () => {
    mockedHook.mockReturnValue(buildHook({ isError: true, mainFile: undefined }));
    render(<UploadSuccessStep uuid='sub-1' />);

    expect(screen.getByText(/Could not load the submission/i)).toBeInTheDocument();
  });
});

describe('UploadSuccessStep package summary', () => {
  const withSummary = (invalid_purls: number) =>
    mockedHook.mockReturnValue(
      buildHook({
        submission: {
          uuid: 'sub-1',
          name: 'RHOSE-4.9.json',
          package_summary: {
            total: 128,
            invalid_purls,
            ecosystems: [{ ecosystem: 'Java', total: 128 }],
          },
        },
      }),
    );

  it('shows the package total and invalid count', () => {
    withSummary(7);
    render(<UploadSuccessStep uuid='sub-1' />);

    expect(screen.getByText('128 packages found')).toBeInTheDocument();
    expect(screen.getByText('7 invalid')).toBeInTheDocument();
  });

  it('omits the invalid count when every package is valid', () => {
    withSummary(0);
    render(<UploadSuccessStep uuid='sub-1' />);

    expect(screen.getByText('128 packages found')).toBeInTheDocument();
    expect(screen.queryByText(/invalid/)).not.toBeInTheDocument();
  });

  it('opens the drawer on the Packages tab from the Details link and resets the hero', async () => {
    const user = userEvent.setup();
    const onOpenedInDrawer = jest.fn();
    withSummary(7);
    render(<UploadSuccessStep uuid='sub-1' onOpenedInDrawer={onOpenedInDrawer} />);

    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(mockOpenSubmission).toHaveBeenCalledWith('sub-1', 'packages');
    expect(onOpenedInDrawer).toHaveBeenCalledTimes(1);
  });

  it('shows no package summary for submissions without one', () => {
    render(<UploadSuccessStep uuid='sub-1' />);

    expect(screen.queryByText(/packages found/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Details' })).not.toBeInTheDocument();
  });
});
