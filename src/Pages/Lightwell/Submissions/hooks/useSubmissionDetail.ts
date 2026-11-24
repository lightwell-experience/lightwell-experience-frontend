import { useEffect, useRef, useState } from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { useQueryClient } from '@tanstack/react-query';

import useNotification from 'Hooks/useNotification';
import { composeErrorDescription } from 'Hooks/useErrorNotification';
import {
  downloadSubmissionArchive,
  downloadSubmissionFile,
} from 'services/Lightwell/ClearinghouseApi';
import {
  CLEARINGHOUSE_SUBMISSIONS_KEY,
  useAddSubmissionFilesMutation,
  useCreateSubmissionMutation,
  useDeleteSubmissionFileMutation,
  useDeleteSubmissionMutation,
  useSubmissionQuery,
  useSubmitSubmissionMutation,
  useProcessSubmissionMutation,
} from 'services/Lightwell/ClearinghouseQueries';
import { validateSubmissionFile } from '../utils/validateSubmissionFile';

type UseSubmissionDetailOptions = {
  uuid: string;
  /** Called after the whole submission is deleted (e.g. to collapse the view). */
  onDeleted?: () => void;
  /** Called after the submission is submitted for validation. */
  onSubmitted?: () => void;
  /** Called with the replacement submission's uuid after a successful resend. */
  onResent?: (newUuid: string) => void;
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
 *
 * `resend` replaces a report that has invalid packageurls with a corrected file:
 * it creates the new submission first and only then deletes this one, so a
 * rejected file never costs the user the original. It is offered (`canResend`)
 * only while the report has invalid packages, no reproducers have been added
 * yet, and the caller may delete the submission.
 */
export const useSubmissionDetail = ({
  uuid,
  onDeleted,
  onSubmitted,
  onResent,
}: UseSubmissionDetailOptions) => {
  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const { data: submission, isLoading, isError } = useSubmissionQuery(uuid);

  const addFilesMutation = useAddSubmissionFilesMutation(uuid);
  const deleteFileMutation = useDeleteSubmissionFileMutation(uuid);
  const deleteSubmissionMutation = useDeleteSubmissionMutation();
  const createSubmissionMutation = useCreateSubmissionMutation();
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
  const invalidPackageCount = submission?.package_summary?.invalid_purls ?? 0;
  const canResend = canDelete && invalidPackageCount > 0 && reproducerFiles.length === 0;

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

  // Spans both steps (create, then delete) so the action stays busy throughout.
  const [isResending, setIsResending] = useState(false);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const resend = async (file: File) => {
    const fileError = validateSubmissionFile(file);
    if (fileError) {
      notify({
        variant: AlertVariant.danger,
        title: 'Could not resend report',
        description: fileError,
      });
      return;
    }

    setIsResending(true);
    // Chained with promises rather than per-call `mutate` callbacks: those are
    // dropped when the component unmounts (e.g. the drawer closes mid-upload),
    // which would skip the delete and leave both submissions behind.
    let created: Awaited<ReturnType<typeof createSubmissionMutation.mutateAsync>>;
    try {
      created = await createSubmissionMutation.mutateAsync(file);
    } catch (err) {
      setIsResending(false);
      notifyError('Could not resend report', err);
      return;
    }

    try {
      await deleteSubmissionMutation.mutateAsync(uuid);
      notify({ variant: AlertVariant.success, title: 'Corrected report resent' });
    } catch {
      // The delete mutation only refreshes the list on success; the new
      // submission must still show up in the table.
      queryClient.invalidateQueries({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
      notify({
        variant: AlertVariant.warning,
        title: 'Corrected report uploaded',
        description:
          'The original submission could not be deleted. Delete it from the submissions table.',
      });
    } finally {
      setIsResending(false);
      // Don't reopen the drawer if the user closed it while the resend ran.
      if (isMountedRef.current) onResent?.(created.uuid);
    }
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
    isResending ||
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
    canResend,
    invalidPackageCount,
    mainFile,
    reproducerFiles,
    addFiles,
    deleteFile,
    deleteWholeSubmission,
    submit,
    process,
    resend,
    download,
    downloadArchive,
    isAddingFiles,
    addingCount,
    isMutating,
    isSubmitting: submitMutation.isPending,
    isProcessing: processMutation.isPending,
    isResending,
    isDownloadingArchive,
  };
};
