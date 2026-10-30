import { useEffect, useState } from 'react';
import {
  useCreateCoverageReportMutation,
  useCoverageReportQuery,
} from 'services/Lightwell/CoverageReportsQueries';
import { validateManifestFile, getMaxFileSizeMB, toBytes } from '../utils/validateManifestFile';
import { LIGHTWELL_LENS_CATALOG_SOURCE, LIGHTWELL_LENS_USE_MOCK } from 'Pages/Lightwell/constants';
import { MOCK_UPLOAD } from '../../mockCoverageAnalysis';
import type { ManifestUploadCardProps } from '../components/ManifestUploadCard';
import { apiError, taskError, timeoutError, type ProcessError } from '../utils/errors';
import { useLightwellNavigateTo } from 'Hooks/Lightwell/navigation/useLightwellNavigateTo';

export type ProcessStep = 'select' | 'uploading' | 'analyzing' | 'complete' | 'error';

const POLLING_RETRY_LIMIT = 40;

export const useManifestUpload = () => {
  if (LIGHTWELL_LENS_USE_MOCK) return MOCK_UPLOAD;

  const [step, setStep] = useState<ProcessStep>('select');
  const [file, setFile] = useState<File | undefined>();
  const [reportUUID, setReportUUID] = useState('');
  const [fileError, setFileError] = useState<string | undefined>();
  const [processError, setProcessError] = useState<ProcessError | undefined>();
  const [pollCount, setPollCount] = useState(0);
  const [filename, setFilename] = useState<string | undefined>();
  const { navigateToLensReport } = useLightwellNavigateTo();

  const createReport = useCreateCoverageReportMutation();

  const shouldPoll = step === 'analyzing' && !!reportUUID;
  const isPolling = shouldPoll && pollCount <= POLLING_RETRY_LIMIT;
  const { data: report, isError: isFetchError } = useCoverageReportQuery(reportUUID, isPolling);

  useEffect(() => {
    if (!shouldPoll || !report) return;

    setPollCount((count) => count + 1);

    if (report.status === 'completed') {
      setStep('complete');
      return;
    }

    if (report.status === 'failed') {
      setProcessError(taskError(report.analysis_task_error));
      setStep('error');
    }
  }, [report, shouldPoll]);

  useEffect(() => {
    if (step !== 'complete' || !reportUUID || !filename) return;

    navigateToLensReport(reportUUID, { state: { filename } });
  }, [step, reportUUID, filename, navigateToLensReport]);

  useEffect(() => {
    if (!shouldPoll) return;

    if (pollCount > POLLING_RETRY_LIMIT) {
      setProcessError(timeoutError());
      setStep('error');
      return;
    }

    if (isFetchError) {
      setProcessError(apiError('fetch'));
      setStep('error');
    }
  }, [pollCount, isFetchError, shouldPoll]);

  // Uses dropzoneProps.onDropAccepted instead of onFileInputChange to avoid a PF bug
  // where onFileInputChange fires twice when selecting a file via the browser dialog
  const handleFileAccepted = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    const limitMB = getMaxFileSizeMB(selectedFile.name);

    if (selectedFile.size > toBytes(limitMB)) {
      setFileError(`File exceeds the ${limitMB} MB size limit. Please try a smaller file.`);
      setFile(selectedFile);
      return;
    }

    if (!validateManifestFile(selectedFile)) {
      setFileError('Could not detect format. Please check your file.');
      setFile(selectedFile);
      return;
    }

    setFileError(undefined);
    setFile(selectedFile);
    setProcessError(undefined);
    setFilename(selectedFile.name);
    setStep('uploading');

    createReport.mutate(
      { file: selectedFile, catalog_source: LIGHTWELL_LENS_CATALOG_SOURCE },
      {
        onSuccess: (data) => {
          setPollCount(0);
          setReportUUID(data.uuid);
          setStep('analyzing');
        },
        onError: () => {
          setProcessError(apiError('upload'));
          setStep('error');
        },
      },
    );
  };

  const handleRetry = () => {
    setStep('select');
    setFile(undefined);
    setReportUUID('');
    setFileError(undefined);
    setProcessError(undefined);
    setPollCount(0);
    setFilename(undefined);
  };

  const uploadProps: ManifestUploadCardProps = {
    file,
    fileError,
    processError,
    step: step === 'complete' ? 'analyzing' : step,
    reportUUID,
    onDropAccepted: handleFileAccepted,
    onRetry: handleRetry,
  };

  return { uploadProps };
};
