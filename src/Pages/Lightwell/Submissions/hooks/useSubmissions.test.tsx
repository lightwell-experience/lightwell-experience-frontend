import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';

import { ReactQueryTestWrapper } from 'testingHelpers';
import { useSubmissions } from './useSubmissions';

const mockNotify = jest.fn();
jest.mock('Hooks/useNotification', () => () => ({ notify: mockNotify }));

let mockCurrentUsername: string | undefined;
jest.mock('./useCurrentUsername', () => ({
  useCurrentUsername: () => mockCurrentUsername,
}));

const jsonFile = () => new File(['{}'], 'submission.json', { type: 'application/json' });

const createdSubmission = {
  uuid: 'sub-1',
  status: 'pending',
  created_at: '2026-10-20T10:00:00Z',
  username: 'author@example.com',
};

const renderSubmissions = () =>
  renderHook(() => useSubmissions(), { wrapper: ReactQueryTestWrapper });

beforeEach(() => {
  mockNotify.mockClear();
  mockCurrentUsername = undefined;
});

describe('useSubmissions', () => {
  it('rejects a non-json file on selection without calling the API', async () => {
    const post = jest.spyOn(axios, 'post');
    const { result } = renderSubmissions();

    act(() => {
      result.current.onDropAccepted([new File([''], 'report.yaml')]);
    });

    await waitFor(() => {
      expect(result.current.fileError).toBe('Only .json files are accepted.');
    });
    expect(result.current.step).toBe('select');
    expect(post).not.toHaveBeenCalled();

    post.mockRestore();
  });

  it('auto-creates the submission on valid file selection (no submit button)', async () => {
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: createdSubmission });
    const { result } = renderSubmissions();

    act(() => {
      result.current.onDropAccepted([jsonFile()]);
    });

    await waitFor(() => expect(result.current.step).toBe('detail'));
    expect(post).toHaveBeenCalledTimes(1);
    expect(result.current.createdUuid).toBe('sub-1');
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
  });

  it('never renders "undefined" in the success toast when the author is missing', async () => {
    const post = jest.spyOn(axios, 'post').mockResolvedValue({
      data: { uuid: 'sub-2', status: 'pending', created_at: '2026-10-20T10:00:00Z' },
    });
    const { result } = renderSubmissions();

    act(() => {
      result.current.onDropAccepted([jsonFile()]);
    });

    await waitFor(() => expect(result.current.step).toBe('detail'));
    const call = mockNotify.mock.calls.find(([payload]) => payload.variant === 'success');
    expect(String(call?.[0]?.description ?? '')).not.toContain('undefined');

    post.mockRestore();
  });

  it('omits the author in the success toast when the submission is by the current user', async () => {
    mockCurrentUsername = createdSubmission.username;
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: createdSubmission });
    const { result } = renderSubmissions();

    act(() => {
      result.current.onDropAccepted([jsonFile()]);
    });

    await waitFor(() => expect(result.current.step).toBe('detail'));
    const call = mockNotify.mock.calls.find(([payload]) => payload.variant === 'success');
    expect(call?.[0]?.description).toBeUndefined();

    post.mockRestore();
  });

  it('returns to select and clears the file when creation fails', async () => {
    const post = jest.spyOn(axios, 'post').mockRejectedValue(new Error('boom'));
    const { result } = renderSubmissions();

    act(() => {
      result.current.onDropAccepted([jsonFile()]);
    });

    await waitFor(() =>
      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ variant: 'danger' })),
    );
    expect(result.current.step).toBe('select');
    expect(result.current.createdUuid).toBeUndefined();
    // A rejected file must not linger as "selected" (green check) next to the error toast.
    expect(result.current.file).toBeUndefined();

    post.mockRestore();
  });

  it('surfaces the backend reason when creation fails (e.g. too many files)', async () => {
    const post = jest.spyOn(axios, 'post').mockRejectedValue({
      response: { data: { errors: [{ status: 400, detail: 'You can attach at most 20 files.' }] } },
    });
    const { result } = renderSubmissions();

    act(() => {
      result.current.onDropAccepted([jsonFile()]);
    });

    await waitFor(() =>
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'danger',
          description: 'You can attach at most 20 files.',
        }),
      ),
    );

    post.mockRestore();
  });

  it('resets back to the select step', async () => {
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: createdSubmission });
    const { result } = renderSubmissions();

    act(() => {
      result.current.onDropAccepted([jsonFile()]);
    });
    await waitFor(() => expect(result.current.step).toBe('detail'));

    act(() => {
      result.current.reset();
    });

    expect(result.current.step).toBe('select');
    expect(result.current.file).toBeUndefined();
    expect(result.current.createdUuid).toBeUndefined();

    post.mockRestore();
  });
});
