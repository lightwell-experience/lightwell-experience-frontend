import { render, screen } from '@testing-library/react';
import ManifestUpload from './ManifestUpload';
import { useManifestUpload } from './hooks/useManifestUpload';
import { ReactQueryTestWrapper } from 'testingHelpers';
import type { ManifestUploadCardProps } from './components/ManifestUploadCard';
import { apiError, taskError } from './utils/errors';

jest.mock('./hooks/useManifestUpload');

jest.mock('@scalprum/react-core', () => ({
  useRemoteHook: jest.fn(),
}));

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true),
}));

jest.mock('Hooks/Lightwell/navigation/useLightwellRootPath', () => ({
  useLightwellRootPath: jest.fn(() => '/lightwell'),
}));

const defaultUploadProps: ManifestUploadCardProps = {
  file: undefined,
  fileError: undefined,
  processError: undefined,
  step: 'select',
  reportUUID: '',
  onDropAccepted: jest.fn(),
  onRetry: jest.fn(),
};

const renderManifestUpload = () =>
  render(
    <ReactQueryTestWrapper>
      <ManifestUpload />
    </ReactQueryTestWrapper>,
  );

describe('ManifestUpload', () => {
  beforeEach(() => {
    (useManifestUpload as jest.Mock).mockReturnValue({
      uploadProps: defaultUploadProps,
    });
  });

  it('shows filename and inline error when file format is invalid', () => {
    (useManifestUpload as jest.Mock).mockReturnValue({
      uploadProps: {
        ...defaultUploadProps,
        file: new File([''], 'report.pdf'),
        fileError: 'Could not detect format. Please check your file.',
      },
    });

    renderManifestUpload();
    expect(screen.getByText(/report.pdf/)).toBeInTheDocument();
    expect(
      screen.getByText(/Could not detect format. Please check your file./),
    ).toBeInTheDocument();
    expect(screen.getByText('Drag and drop a file here')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
  });

  it('shows uploading step in progress while the file is uploading', () => {
    (useManifestUpload as jest.Mock).mockReturnValue({
      uploadProps: {
        ...defaultUploadProps,
        step: 'uploading',
      },
    });

    renderManifestUpload();
    expect(screen.getByRole('heading', { name: 'Analyzing your manifest...' })).toBeInTheDocument();
    expect(screen.getByText('Uploading manifest')).toBeInTheDocument();
    expect(screen.getByText('Preparing analysis report')).toBeInTheDocument();
    expect(screen.getByLabelText('In progress')).toBeInTheDocument();
    expect(screen.queryByLabelText('Complete')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Analyzing')).not.toBeInTheDocument();
  });

  it('shows preparing report in progress after upload succeeds', () => {
    (useManifestUpload as jest.Mock).mockReturnValue({
      uploadProps: {
        ...defaultUploadProps,
        step: 'analyzing',
        reportUUID: 'test-uuid',
      },
    });

    renderManifestUpload();
    expect(screen.getByLabelText('Complete')).toBeInTheDocument();
    expect(screen.getByLabelText('In progress')).toBeInTheDocument();
  });

  it('shows the upload failure on the progress card', () => {
    const error = apiError('upload');
    (useManifestUpload as jest.Mock).mockReturnValue({
      uploadProps: {
        ...defaultUploadProps,
        step: 'error',
        processError: error,
      },
    });

    renderManifestUpload();
    expect(screen.getByRole('heading', { name: 'Analysis failed' })).toBeInTheDocument();
    expect(screen.getByText('Uploading manifest')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Failed')).toHaveLength(2);
    expect(screen.getByText(error.title)).toBeInTheDocument();
    expect(screen.getByText(error.description)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reupload file' })).toBeInTheDocument();
  });

  it('shows the task error on the progress card after upload succeeds but analysis fails', () => {
    const error = taskError('Failed to parse manifest: unexpected EOF');
    (useManifestUpload as jest.Mock).mockReturnValue({
      uploadProps: {
        ...defaultUploadProps,
        step: 'error',
        reportUUID: 'test-uuid',
        processError: error,
      },
    });

    renderManifestUpload();
    expect(screen.getByRole('heading', { name: 'Analysis failed' })).toBeInTheDocument();
    expect(screen.getByLabelText('Complete')).toBeInTheDocument();
    expect(screen.getByLabelText('Failed')).toBeInTheDocument();
    expect(screen.getByText(error.title)).toBeInTheDocument();
    expect(screen.getByText(error.description)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reupload file' })).toBeInTheDocument();
  });

  it('shows upload instructions and supported formats when no report exists', () => {
    renderManifestUpload();
    expect(screen.getByText('Lens')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Get an analysis of your stack against the Lightwell Network catalog to immediately surface missing components, alternative options, and compatibility insights.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Supported formats: CSV, CycloneDX, SPDX, POM, requirements.txt/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /File size limit: Up to 10MB for POM files. Up to 15MB for all other supported formats./,
      ),
    ).toBeInTheDocument();
  });
});
