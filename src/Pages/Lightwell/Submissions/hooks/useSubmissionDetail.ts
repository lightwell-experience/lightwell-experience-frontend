import { useState } from 'react';
import { AlertVariant } from '@patternfly/react-core';

import useNotification from 'Hooks/useNotification';
import { composeErrorDescription } from 'Hooks/useErrorNotification';
import {
  downloadSubmissionArchive,
  downloadSubmissionFile,
} from 'services/Lightwell/ClearinghouseApi';
import {
  useAddSubmissionFilesMutation,
  useDeleteSubmissionFileMutation,
  useDeleteSubmissionMutation,
  useSubmissionQuery,
  useSubmitSubmissionMutation,
  useProcessSubmissionMutation,
} from 'services/Lightwell/ClearinghouseQueries';

type UseSubmissionDetailOptions = {
  uuid: string;
  /** Called after the whole submission is deleted (e.g. to collapse the view). */
  onDeleted?: () => void;
  /** Called after the submission is submitted for validation. */
  onSubmitted?: () => void;
};

/**
 * Drives the SubmissionDetail view: fetches a submission, splits its main
 * report from reproducer files, and exposes add / delete / submit / process /
 * download actions. The `can*` flags come straight from the backend's
 * per-caller permission fields (`can_add_reproducers`, `can_delete`,
 * `can_submit`, `can_process`, `can_download`), so the UI never re-derives the
 * authorization rules. They are all false until the submission loads. Per-file
 * delete / download is gated by each file's own `can_delete` / `can_download`.
 * Callers hide controls accordingly.
 */
export const useSubmissionDetail = ({
  uuid,
  onDeleted,
  onSubmitted,
}: UseSubmissionDetailOptions) => {
  const { notify } = useNotification();
  const { data: submission, isLoading, isError } = useSubmissionQuery(uuid);

  const addFilesMutation = useAddSubmissionFilesMutation(uuid);
  const deleteFileMutation = useDeleteSubmissionFileMutation(uuid);
  const deleteSubmissionMutation = useDeleteSubmissionMutation();
  const submitMutation = useSubmitSubmissionMutation(uuid);
  const processMutation = useProcessSubmissionMutation(uuid);

  // The main report is the file the backend flags with `submission: true`; the
  // rest are reproducers.
  const files = submission?.files ?? [];
  const mainFile = files.find((file) => file.submission) ?? files[0];
  const reproducerFiles = files.filter((file) => file !== mainFile);

  const canAddReproducers = !!submission?.can_add_reproducers;
  const canDelete = !!submission?.can_delete;
  const canSubmit = !!submission?.can_submit;
  const canProcess = !!submission?.can_process;
  const canDownload = !!submission?.can_download;

  // Surface the backend's reason (e.g. too many files, duplicate filename)
  // instead of a generic message; fall back to the generic text otherwise.
  const notifyError = (title: string, err?: unknown) => {
    const { title: resolvedTitle, description } = composeErrorDescription(
      title,
      'Please try again.',
      err,
    );
    notify({ variant: AlertVariant.danger, title: resolvedTitle, description });
  };

  const addFiles = (newFiles: File[], opts?: { onSuccess?: () => void }) => {
    if (!newFiles.length) return;
    addFilesMutation.mutate(newFiles, {
      onSuccess: opts?.onSuccess,
      onError: (err) => notifyError('Could not add files', err),
    });
  };

  const deleteFile = (filename: string) => {
    deleteFileMutation.mutate(filename, {
      onError: (err) => notifyError('Could not delete file', err),
    });
  };

  const deleteWholeSubmission = () => {
    deleteSubmissionMutation.mutate(uuid, {
      onSuccess: () => {
        notify({ variant: AlertVariant.success, title: 'Submission deleted' });
        onDeleted?.();
      },
      onError: (err) => notifyError('Could not delete submission', err),
    });
  };

  const submit = () => {
    submitMutation.mutate(undefined, {
      onSuccess: () => {
        notify({
          variant: AlertVariant.success,
          title: 'Submitted for structural validation',
        });
        onSubmitted?.();
      },
      onError: (err) => notifyError('Could not submit submission', err),
    });
  };

  const process = () => {
    processMutation.mutate(undefined, {
      onSuccess: () => {
        notify({ variant: AlertVariant.success, title: 'Submission marked as processed' });
      },
      onError: (err) => notifyError('Could not mark the submission as processed', err),
    });
  };

  const download = (filename: string) => {
    downloadSubmissionFile(uuid, filename).catch((err) =>
      notifyError('Could not download file', err),
    );
  };

  // Large archives take a few seconds to build and download, so track the
  // request to give the "Download all" button visible feedback.
  const [isDownloadingArchive, setIsDownloadingArchive] = useState(false);
  const downloadArchive = () => {
    setIsDownloadingArchive(true);
    downloadSubmissionArchive(uuid)
      .catch((err) => notifyError('Could not download archive', err))
      .finally(() => setIsDownloadingArchive(false));
  };

  // `addFilesMutation.variables` is the File[] handed to `mutate`, so while the
  // upload is in flight we know how many reproducer rows to show as skeletons.
  const isAddingFiles = addFilesMutation.isPending;
  const addingCount = isAddingFiles ? (addFilesMutation.variables?.length ?? 0) : 0;

  const isMutating =
    addFilesMutation.isPending ||
    deleteFileMutation.isPending ||
    deleteSubmissionMutation.isPending ||
    submitMutation.isPending ||
    processMutation.isPending;

  return {
    submission,
    isLoading,
    isError,
    canAddReproducers,
    canDelete,
    canSubmit,
    canProcess,
    canDownload,
    mainFile,
    reproducerFiles,
    addFiles,
    deleteFile,
    deleteWholeSubmission,
    submit,
    process,
    download,
    downloadArchive,
    isAddingFiles,
    addingCount,
    isMutating,
    isSubmitting: submitMutation.isPending,
    isProcessing: processMutation.isPending,
    isDownloadingArchive,
  };
};
