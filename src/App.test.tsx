import { render, screen } from '@testing-library/react';
import { useFlag, useFlagsStatus } from '@unleash/proxy-client-react';

import App from './App';

const accessGranted = 'Access granted!';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(),
  useFlagsStatus: jest.fn(),
}));

jest.mock('./Routes', () => ({
  __esModule: true,
  default: jest.fn(() => <div>{accessGranted}</div>),
}));

const setPathname = (pathname: string) => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, pathname },
  });
};

describe('lightwell-next access gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPathname('/lightwell-next');
    jest.mocked(useFlag).mockReturnValue(false);
    jest.mocked(useFlagsStatus).mockReturnValue({ flagsReady: true, flagsError: null });
  });

  it('mounts routes when the access flag is enabled', () => {
    jest.mocked(useFlag).mockReturnValue(true);

    render(<App />);

    expect(useFlag).toHaveBeenCalledWith('lightwell-experience.lightwell-next-access.enabled');
    expect(screen.getByText(accessGranted)).toBeInTheDocument();
  });

  it('does not mount routes when the access flag is disabled', () => {
    render(<App />);

    expect(screen.getByText(/do not have access/i)).toBeInTheDocument();
    expect(screen.queryByText(accessGranted)).not.toBeInTheDocument();
  });

  it('unmounts routes when access is revoked', () => {
    jest.mocked(useFlag).mockReturnValue(true);
    const { rerender } = render(<App />);

    jest.mocked(useFlag).mockReturnValue(false);
    rerender(<App />);

    expect(screen.getByText(/do not have access/i)).toBeInTheDocument();
    expect(screen.queryByText(accessGranted)).not.toBeInTheDocument();
  });

  it('skips the gate on non-lightwell-next paths', () => {
    setPathname('/lightwell-other');

    render(<App />);

    expect(screen.getByText(accessGranted)).toBeInTheDocument();
    expect(screen.queryByText(/do not have access/i)).not.toBeInTheDocument();
  });
});
