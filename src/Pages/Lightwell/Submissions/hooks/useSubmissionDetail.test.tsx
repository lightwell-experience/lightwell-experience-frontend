import { act, renderHook, waitFor } from '@testing-library/react';

import type { ClearinghouseSubmission } from 'services/Lightwell/ClearinghouseApi';
import { useSubmissionDetail } from './useSubmissionDetail';

const mockNotify = jest.fn();
jest.mock('Hooks/useNotification', () => () => ({ notify: mockNotify }));

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
      can_delete: true,
      can_download: false,
    },
    {
      uuid: 'f-1',
      filename: 'repro.jpg',
      username: 'author@example.com',
      created_at: '2026-10-20T10:05:00Z',
      can_delete: true,
      can_download: false,
    },
  ],
  can_delete: true,
  can_download: false,
  can_add_reproducers: true,
  can_submit: true,
  can_process: false,
};

const render = (opts: Parameters<typeof useSubmissionDetail>[0]) =>
  renderHook(() => useSubmissionDetail(opts));

beforeEach(() => {
  jest.clearAllMocks();
  mockSubmission = pendingSubmission;
  mockIsLoading = false;
  mockIsError = false;
});

describe('useSubmissionDetail', () => {
  it('exposes the backend permission flags for the submission', () => {
    const { result, rerender } = render({ uuid: 'sub-1' });
    expect(result.current.canAddReproducers).toBe(true);
    expect(result.current.canDelete).toBe(true);
    expect(result.current.canSubmit).toBe(true);
    expect(result.current.canProcess).toBe(false);
    expect(result.current.canDownload).toBe(false);

    mockSubmission = {
      ...pendingSubmission,
      status: 'submitted',
      can_delete: false,
      can_download: true,
      can_add_reproducers: false,
      can_submit: false,
      can_process: true,
    };
    rerender();
    expect(result.current.canAddReproducers).toBe(false);
    expect(result.current.canDelete).toBe(false);
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.canProcess).toBe(true);
    expect(result.current.canDownload).toBe(true);
  });

  it('fails closed (no permissions) until the submission loads', () => {
    mockSubmission = undefined;
    mockIsLoading = true;
    const { result } = render({ uuid: 'sub-1' });
    expect(result.current.canAddReproducers).toBe(false);
    expect(result.current.canDelete).toBe(false);
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.canProcess).toBe(false);
    expect(result.current.canDownload).toBe(false);
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
