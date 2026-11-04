import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addSubmissionFiles,
  createSubmission,
  deleteSubmission,
  deleteSubmissionFile,
  getSubmission,
  listSubmissions,
  submitSubmission,
  processSubmission,
} from './ClearinghouseApi';

export const CLEARINGHOUSE_SUBMISSIONS_KEY = 'CLEARINGHOUSE_SUBMISSIONS_KEY';
export const CLEARINGHOUSE_SUBMISSION_KEY = 'CLEARINGHOUSE_SUBMISSION_KEY';

// No `meta` error toast: SubmissionsTable rethrows to the error boundary,
// so adding the global meta toast would double-report the same failure.
export const useSubmissionsListQuery = (page: number, perPage: number) =>
  useQuery({
    queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY, page, perPage],
    queryFn: () => listSubmissions(perPage, (page - 1) * perPage),
    placeholderData: keepPreviousData,
    staleTime: 20000,
  });

// No `meta` error toast: the submission detail views render an inline error
// alert, so the global meta toast would double-report the same failure.
export const useSubmissionQuery = (uuid: string) =>
  useQuery({
    queryKey: [CLEARINGHOUSE_SUBMISSION_KEY, uuid],
    queryFn: () => getSubmission(uuid),
    enabled: !!uuid,
  });

// Errors are handled inline by the calling hook (useSubmissions) so it can
// surface a toast and keep the intake form open for a retry. The list is NOT
// invalidated here on purpose: the new submission should only appear in the
// table once the author saves it for later (Submissions handles that).
export const useCreateSubmissionMutation = () =>
  useMutation({ mutationFn: (file: File) => createSubmission(file) });

export const useAddSubmissionFilesMutation = (uuid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => addSubmissionFiles(uuid, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLEARINGHOUSE_SUBMISSION_KEY, uuid] });
      queryClient.invalidateQueries({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
    },
  });
};

export const useDeleteSubmissionFileMutation = (uuid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) => deleteSubmissionFile(uuid, filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLEARINGHOUSE_SUBMISSION_KEY, uuid] });
      queryClient.invalidateQueries({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
    },
  });
};

export const useDeleteSubmissionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteSubmission(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
    },
  });
};

export const useSubmitSubmissionMutation = (uuid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => submitSubmission(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLEARINGHOUSE_SUBMISSION_KEY, uuid] });
      queryClient.invalidateQueries({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
    },
  });
};

export const useProcessSubmissionMutation = (uuid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => processSubmission(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLEARINGHOUSE_SUBMISSION_KEY, uuid] });
      queryClient.invalidateQueries({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
    },
  });
};
