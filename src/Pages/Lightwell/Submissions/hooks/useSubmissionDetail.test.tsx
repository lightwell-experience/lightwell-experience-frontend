import { act, renderHook, waitFor } from '@testing-library/react';

import type { ClearinghouseSubmission } from 'services/Lightwell/ClearinghouseApi';
import { useSubmissionDetail } from './useSubmissionDetail';

const mockNotify = jest.fn();
jest.mock('Hooks/useNotification', () => () => ({ notify: mockNotify }));

let mockCurrentUsername: string | undefined = 'author@example.com';
jest.mock('./useCurrentUsername', () => ({
  useCurrentUsername: () => mockCurrentUsername,
}));

let mockSubmission: ClearinghouseSubmission | undefined;
let mockIsLoading = false;
let mockIsError = false;

const mockAddMutate = jest.fn();
const mockDeleteFileMutate = jest.fn();
const mockDeleteSubmissionMutate = jest.fn();
const mockSubmitMutate = jest.fn();
const mockProcessMutate = jest.fn();

jest.mock('services/Lightwell/ClearinghouseQueries', () => ({
  useSubmissionQuery: () => ({
    data: mockSubmission,
    isLoading: mockIsLoading,
    isError: mockIsError,
  }),
  useAddSubmissionFilesMutation: () => ({ mutate: mockAddMutate, isPending: false }),
  useDeleteSubmissionFileMutation: () => ({ mutate: mockDeleteFileMutate, isPending: false }),
  useDeleteSubmissionMutation: () => ({ mutate: mockDeleteSubmissionMutate, isPending: false }),
  useSubmitSubmissionMutation: () => ({ mutate: mockSubmitMutate, isPending: false }),
  useProcessSubmissionMutation: () => ({ mutate: mockProcessMutate, isPending: false }),
}));

const ON = { enabled: true, accessible: true };
let mockFeatures: Record<string, { enabled: boolean; accessible: boolean }> = {
  lightwellclearinghouse: ON,
  lightwellclearinghouseread: ON,
};
jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({ features: mockFeatures }),
}));

const mockDownloadSubmissionFile = jest.fn();
const mockDownloadSubmissionArchive = jest.fn<Promise<void>, unknown[]>(() => Promise.resolve());
jest.mock('services/Lightwell/ClearinghouseApi', () => ({
  downloadSubmissionFile: (...args: unknown[]) => {
    mockDownloadSubmissionFile(...args);
    return Promise.resolve();
  },
  downloadSubmissionArchive: (...args: unknown[]) => mockDownloadSubmissionArchive(...args),
}));

const pendingSubmission: ClearinghouseSubmission = {
  uuid: 'sub-1',
  status: 'pending',
  created_at: '2026-10-20T10:00:00Z',
  username: 'author@example.com',
  name: 'RHOSE-4.9.json',
  files: [
    {
      uuid: 'f-0',
      filename: 'RHOSE-4.9.json',
      username: 'author@example.com',
      created_at: '2026-10-20T10:00:00Z',
      submission: true,
    },
    {
      uuid: 'f-1',
      filename: 'repro.jpg',
      username: 'author@example.com',
      created_at: '2026-10-20T10:05:00Z',
    },
  ],
};

const render = (opts: Parameters<typeof useSubmissionDetail>[0]) =>
  renderHook(() => useSubmissionDetail(opts));

beforeEach(() => {
  jest.clearAllMocks();
  mockSubmission = pendingSubmission;
  mockIsLoading = false;
  mockIsError = false;
  mockFeatures = { lightwellclearinghouse: ON, lightwellclearinghouseread: ON };
  mockCurrentUsername = 'author@example.com';
});

describe('useSubmissionDetail', () => {
  it('can edit only while pending and only with the write feature', () => {
    const { result, rerender } = render({ uuid: 'sub-1' });
    expect(result.current.canEdit).toBe(true);

    mockSubmission = { ...pendingSubmission, status: 'submitted' };
    rerender();
    expect(result.current.canEdit).toBe(false);

    mockSubmission = pendingSubmission;
    mockFeatures = { lightwellclearinghouseread: ON };
    rerender();
    expect(result.current.canEdit).toBe(false);
  });

  it('can manage (submit/delete) only when the current user is the submission author', () => {
    // Author of a pending submission with write access: can manage.
    const { result, rerender } = render({ uuid: 'sub-1' });
    expect(result.current.canEdit).toBe(true);
    expect(result.current.canManage).toBe(true);

    // A different write user can still edit (add reproducers) but cannot manage.
    mockCurrentUsername = 'someone-else@example.com';
    rerender();
    expect(result.current.canEdit).toBe(true);
    expect(result.current.canManage).toBe(false);

    // Fails closed before the username resolves.
    mockCurrentUsername = undefined;
    rerender();
    expect(result.current.canManage).toBe(false);

    // The author of a non-pending submission cannot manage it.
    mockCurrentUsername = 'author@example.com';
    mockSubmission = { ...pendingSubmission, status: 'submitted' };
    rerender();
    expect(result.current.canManage).toBe(false);
  });

  it('can process only a submitted submission and only with the read feature', () => {
    mockSubmission = { ...pendingSubmission, status: 'submitted' };
    const { result, rerender } = render({ uuid: 'sub-1' });
    expect(result.current.canProcess).toBe(true);

    mockFeatures = { lightwellclearinghouse: ON };
    rerender();
    expect(result.current.canProcess).toBe(false);

    mockSubmission = pendingSubmission;
    mockFeatures = { lightwellclearinghouseread: ON };
    rerender();
    expect(result.current.canProcess).toBe(false);
  });

  it('gates download to read users on submitted/processed submissions', () => {
    // The author (write only) can never download, regardless of status.
    mockFeatures = { lightwellclearinghouse: ON };
    mockSubmission = { ...pendingSubmission, status: 'pending' };
    const { result, rerender } = render({ uuid: 'sub-1' });
    expect(result.current.canDownload).toBe(false);

    mockSubmission = { ...pendingSubmission, status: 'submitted' };
    rerender();
    expect(result.current.canDownload).toBe(false);

    // Read users cannot download while pending...
    mockFeatures = { lightwellclearinghouseread: ON };
    mockSubmission = { ...pendingSubmission, status: 'pending' };
    rerender();
    expect(result.current.canDownload).toBe(false);

    // ...but can once submitted or processed.
    mockSubmission = { ...pendingSubmission, status: 'submitted' };
    rerender();
    expect(result.current.canDownload).toBe(true);

    mockSubmission = { ...pendingSubmission, status: 'processed' };
    rerender();
    expect(result.current.canDownload).toBe(true);
  });

  it('processes the submission through the process mutation', () => {
    mockProcessMutate.mockImplementation((_variables, opts) => opts?.onSuccess?.());
    mockSubmission = { ...pendingSubmission, status: 'submitted' };
    const { result } = render({ uuid: 'sub-1' });

    result.current.process();

    expect(mockProcessMutate).toHaveBeenCalledWith(undefined, expect.any(Object));
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
  });

  it('splits the main report (by submission.filename) from reproducer files', () => {
    const { result } = render({ uuid: 'sub-1' });
    expect(result.current.mainFile?.filename).toBe('RHOSE-4.9.json');
    expect(result.current.reproducerFiles.map((f) => f.filename)).toEqual(['repro.jpg']);
  });

  it('adds files through the add mutation', () => {
    const { result } = render({ uuid: 'sub-1' });
    const file = new File(['a'], 'a.jpg');

    result.current.addFiles([file]);

    expect(mockAddMutate).toHaveBeenCalledWith([file], expect.any(Object));
  });

  it('runs the provided onSuccess callback after files are added', () => {
    mockAddMutate.mockImplementation((_files, opts) => opts?.onSuccess?.());
    const onSuccess = jest.fn();
    const { result } = render({ uuid: 'sub-1' });

    result.current.addFiles([new File(['a'], 'a.jpg')], { onSuccess });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('deletes a single file through the delete-file mutation', () => {
    const { result } = render({ uuid: 'sub-1' });

    result.current.deleteFile('repro.jpg');

    expect(mockDeleteFileMutate).toHaveBeenCalledWith('repro.jpg', expect.any(Object));
  });

  it('deletes the whole submission and fires onDeleted + success toast', () => {
    mockDeleteSubmissionMutate.mockImplementation((_uuid, opts) => opts?.onSuccess?.());
    const onDeleted = jest.fn();
    const { result } = render({ uuid: 'sub-1', onDeleted });

    result.current.deleteWholeSubmission();

    expect(mockDeleteSubmissionMutate).toHaveBeenCalledWith('sub-1', expect.any(Object));
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
  });

  it('submits and fires onSubmitted + success toast', () => {
    mockSubmitMutate.mockImplementation((_variables, opts) => opts?.onSuccess?.());
    const onSubmitted = jest.fn();
    const { result } = render({ uuid: 'sub-1', onSubmitted });

    result.current.submit();

    expect(mockSubmitMutate).toHaveBeenCalledWith(undefined, expect.any(Object));
    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
  });

  it('surfaces a danger toast when an edit fails', () => {
    mockDeleteFileMutate.mockImplementation((_filename, opts) => opts?.onError?.(new Error('x')));
    const { result } = render({ uuid: 'sub-1' });

    result.current.deleteFile('repro.jpg');

    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ variant: 'danger' }));
  });

  it('surfaces the backend reason when adding files fails (e.g. duplicate filename)', () => {
    mockAddMutate.mockImplementation((_files, opts) =>
      opts?.onError?.({
        response: {
          data: { errors: [{ status: 409, detail: 'A file with that name already exists.' }] },
        },
      }),
    );
    const { result } = render({ uuid: 'sub-1' });

    result.current.addFiles([new File(['a'], 'a.jpg')]);

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'danger',
        description: 'A file with that name already exists.',
      }),
    );
  });

  it('downloads a file by filename', () => {
    const { result } = render({ uuid: 'sub-1' });

    result.current.download('repro.jpg');

    expect(mockDownloadSubmissionFile).toHaveBeenCalledWith('sub-1', 'repro.jpg');
  });

  it('downloads the whole submission as an archive', () => {
    const { result } = render({ uuid: 'sub-1' });

    result.current.downloadArchive();

    expect(mockDownloadSubmissionArchive).toHaveBeenCalledWith('sub-1');
  });

  it('flags the archive download as in progress until it settles', async () => {
    let finish: () => void = () => {};
    mockDownloadSubmissionArchive.mockImplementationOnce(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const { result } = render({ uuid: 'sub-1' });
    expect(result.current.isDownloadingArchive).toBe(false);

    act(() => result.current.downloadArchive());
    expect(result.current.isDownloadingArchive).toBe(true);

    act(() => finish());
    await waitFor(() => expect(result.current.isDownloadingArchive).toBe(false));
  });
});
