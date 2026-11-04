import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import * as api from './ClearinghouseApi';
import {
  CLEARINGHOUSE_SUBMISSION_KEY,
  CLEARINGHOUSE_SUBMISSIONS_KEY,
  useSubmissionsListQuery,
  useSubmissionQuery,
  useAddSubmissionFilesMutation,
  useDeleteSubmissionFileMutation,
  useDeleteSubmissionMutation,
  useSubmitSubmissionMutation,
  useProcessSubmissionMutation,
  useCreateSubmissionMutation,
} from './ClearinghouseQueries';

jest.mock('./ClearinghouseApi');
const mockedApi = api as jest.Mocked<typeof api>;

const submission = {
  uuid: 'sub-1',
  status: 'pending' as const,
  created_at: '2026-10-20T10:00:00Z',
  username: 'author@example.com',
};

const makeWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidate };
};

beforeEach(() => jest.clearAllMocks());

describe('useProcessSubmissionMutation', () => {
  it('processes and invalidates caches', async () => {
    mockedApi.processSubmission.mockResolvedValue({ ...submission, status: 'processed' });
    const { wrapper, invalidate } = makeWrapper();
    const { result } = renderHook(() => useProcessSubmissionMutation('sub-1'), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(mockedApi.processSubmission).toHaveBeenCalledWith('sub-1'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [CLEARINGHOUSE_SUBMISSION_KEY, 'sub-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
  });
});

describe('useCreateSubmissionMutation', () => {
  it('creates the submission without invalidating the list (table updates on save-for-later)', async () => {
    mockedApi.createSubmission.mockResolvedValue(submission);
    const { wrapper, invalidate } = makeWrapper();
    const { result } = renderHook(() => useCreateSubmissionMutation(), { wrapper });

    result.current.mutate(new File(['{}'], 'r.json'));

    await waitFor(() => expect(mockedApi.createSubmission).toHaveBeenCalled());
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
  });
});

describe('useSubmissionsListQuery', () => {
  it('maps page/perPage to limit/offset', async () => {
    mockedApi.listSubmissions.mockResolvedValue({
      data: [submission],
      meta: { count: 1, limit: 20, offset: 20 },
      links: { first: '', last: '' },
    });
    const { wrapper } = makeWrapper();

    renderHook(() => useSubmissionsListQuery(2, 20), { wrapper });

    await waitFor(() => expect(mockedApi.listSubmissions).toHaveBeenCalledWith(20, 20));
  });
});

describe('useSubmissionQuery', () => {
  it('fetches by uuid when given one', async () => {
    mockedApi.getSubmission.mockResolvedValue(submission);
    const { wrapper } = makeWrapper();

    renderHook(() => useSubmissionQuery('sub-1'), { wrapper });

    await waitFor(() => expect(mockedApi.getSubmission).toHaveBeenCalledWith('sub-1'));
  });

  it('is disabled (no fetch) when uuid is empty', () => {
    const { wrapper } = makeWrapper();

    renderHook(() => useSubmissionQuery(''), { wrapper });

    expect(mockedApi.getSubmission).not.toHaveBeenCalled();
  });
});

describe('useAddSubmissionFilesMutation', () => {
  it('adds files and invalidates the submission and list caches', async () => {
    mockedApi.addSubmissionFiles.mockResolvedValue(submission);
    const { wrapper, invalidate } = makeWrapper();
    const { result } = renderHook(() => useAddSubmissionFilesMutation('sub-1'), { wrapper });

    const file = new File(['a'], 'a.jpg');
    result.current.mutate([file]);

    await waitFor(() => expect(mockedApi.addSubmissionFiles).toHaveBeenCalledWith('sub-1', [file]));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [CLEARINGHOUSE_SUBMISSION_KEY, 'sub-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
  });
});

describe('useDeleteSubmissionFileMutation', () => {
  it('deletes a file and invalidates caches', async () => {
    mockedApi.deleteSubmissionFile.mockResolvedValue();
    const { wrapper, invalidate } = makeWrapper();
    const { result } = renderHook(() => useDeleteSubmissionFileMutation('sub-1'), { wrapper });

    result.current.mutate('a.jpg');

    await waitFor(() =>
      expect(mockedApi.deleteSubmissionFile).toHaveBeenCalledWith('sub-1', 'a.jpg'),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [CLEARINGHOUSE_SUBMISSION_KEY, 'sub-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
  });
});

describe('useDeleteSubmissionMutation', () => {
  it('deletes a submission and invalidates the list cache', async () => {
    mockedApi.deleteSubmission.mockResolvedValue();
    const { wrapper, invalidate } = makeWrapper();
    const { result } = renderHook(() => useDeleteSubmissionMutation(), { wrapper });

    result.current.mutate('sub-1');

    await waitFor(() => expect(mockedApi.deleteSubmission).toHaveBeenCalledWith('sub-1'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
  });
});

describe('useSubmitSubmissionMutation', () => {
  it('submits and invalidates caches', async () => {
    mockedApi.submitSubmission.mockResolvedValue({ ...submission, status: 'submitted' });
    const { wrapper, invalidate } = makeWrapper();
    const { result } = renderHook(() => useSubmitSubmissionMutation('sub-1'), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(mockedApi.submitSubmission).toHaveBeenCalledWith('sub-1'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [CLEARINGHOUSE_SUBMISSION_KEY, 'sub-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
  });
});
