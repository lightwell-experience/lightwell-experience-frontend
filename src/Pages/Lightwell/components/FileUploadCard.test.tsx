import { render, screen } from '@testing-library/react';

import FileUploadCard from './FileUploadCard';

describe('FileUploadCard', () => {
  it('renders the title and the default dropzone prompt', () => {
    render(<FileUploadCard title='Select your file' onDropAccepted={jest.fn()} />);

    expect(screen.getByText('Select your file')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop a file here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeInTheDocument();
  });

  it('renders a custom dropzone title', () => {
    render(
      <FileUploadCard
        title='Select your file'
        dropzoneTitle='Drag and drop findings JSON file'
        onDropAccepted={jest.fn()}
      />,
    );

    expect(screen.getByText('Drag and drop findings JSON file')).toBeInTheDocument();
  });

  it('renders the action slot and info text when provided', () => {
    render(
      <FileUploadCard
        title='Select your file'
        action={<span>Help trigger</span>}
        infoText='Supported formats: JSON'
        onDropAccepted={jest.fn()}
      />,
    );

    expect(screen.getByText('Help trigger')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: JSON')).toBeInTheDocument();
  });

  it('renders footer actions', () => {
    render(
      <FileUploadCard
        title='Select your file'
        footer={<button type='button'>Submit</button>}
        onDropAccepted={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('shows the selected file name when a valid file is chosen', () => {
    render(
      <FileUploadCard
        title='Select your file'
        file={new File(['{}'], 'submission.json')}
        onDropAccepted={jest.fn()}
      />,
    );

    expect(screen.getByText(/submission\.json/)).toBeInTheDocument();
  });

  it('shows the file name alongside the error when a file was rejected', () => {
    render(
      <FileUploadCard
        title='Select your file'
        file={new File([''], 'report.yaml')}
        fileError='Only .json files are accepted.'
        onDropAccepted={jest.fn()}
      />,
    );

    expect(screen.getByText('report.yaml: Only .json files are accepted.')).toBeInTheDocument();
  });

  it('shows the error without a file name when no file is present', () => {
    render(
      <FileUploadCard
        title='Select your file'
        fileError='Something went wrong.'
        onDropAccepted={jest.fn()}
      />,
    );

    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });
});
