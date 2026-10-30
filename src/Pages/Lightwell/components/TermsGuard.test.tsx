import { render, screen } from '@testing-library/react';

import TermsGuard, { buildTermsUrl } from './TermsGuard';
import { ReactQueryTestWrapper } from 'testingHelpers';

jest.mock('services/Lightwell/TermsQueries', () => ({
  useTermsRequired: jest.fn(),
  TERMS_REQUIRED_KEY: 'TERMS_REQUIRED_KEY',
}));

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  useChrome: () => ({ getEnvironment: () => 'stage' }),
}));

import { useTermsRequired } from 'services/Lightwell/TermsQueries';

const renderGuard = () =>
  render(
    <ReactQueryTestWrapper>
      <TermsGuard>
        <div data-ouia-component-id='protected-content'>Protected</div>
      </TermsGuard>
    </ReactQueryTestWrapper>,
  );

it('shows loader while loading', () => {
  (useTermsRequired as jest.Mock).mockReturnValue({
    isLoading: true,
    data: undefined,
    isError: false,
  });
  renderGuard();

  expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

it('renders children when terms are not required', () => {
  (useTermsRequired as jest.Mock).mockReturnValue({
    isLoading: false,
    data: { required: false },
    isError: false,
  });
  renderGuard();

  expect(screen.getByTestId('protected-content')).toBeInTheDocument();
});

it('redirects to terms service when terms are required', () => {
  const originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: 'https://console.redhat.com/lightwell' },
  });

  (useTermsRequired as jest.Mock).mockReturnValue({
    isLoading: false,
    data: { required: true, site: 'lightwell', events: ['network', 'academic'] },
    isError: false,
  });
  renderGuard();

  expect(window.location.href).toContain('www.stage.redhat.com/wapps/tnc/ackrequired');
  expect(window.location.href).toContain('site=lightwell');
  expect(window.location.href).toContain('event=network');
  expect(window.location.href).toContain('event=academic');
  expect(window.location.href).toContain(
    `redirect=${encodeURIComponent('https://console.redhat.com/lightwell')}`,
  );

  Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
});

it('shows error page when backend returns an error', () => {
  (useTermsRequired as jest.Mock).mockReturnValue({
    isLoading: false,
    data: undefined,
    isError: true,
  });
  renderGuard();

  expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  expect(screen.getByText('Service temporarily unavailable')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
});

it('renders children when required but site/events missing', () => {
  (useTermsRequired as jest.Mock).mockReturnValue({
    isLoading: false,
    data: { required: true },
    isError: false,
  });
  renderGuard();

  expect(screen.getByTestId('protected-content')).toBeInTheDocument();
});

describe('buildTermsUrl', () => {
  it('builds a correct URL with encoded redirect and single event', () => {
    const url = buildTermsUrl(
      'https://www.stage.redhat.com',
      'https://console.redhat.com/lightwell',
      'lightwell',
      ['network'],
    );

    expect(url).toBe(
      'https://www.stage.redhat.com/wapps/tnc/ackrequired?site=lightwell&event=network&redirect=https%3A%2F%2Fconsole.redhat.com%2Flightwell',
    );
  });

  it('builds a correct URL with multiple events', () => {
    const url = buildTermsUrl(
      'https://www.stage.redhat.com',
      'https://console.redhat.com/lightwell',
      'lightwell',
      ['network', 'academic'],
    );

    expect(url).toBe(
      'https://www.stage.redhat.com/wapps/tnc/ackrequired?site=lightwell&event=network&event=academic&redirect=https%3A%2F%2Fconsole.redhat.com%2Flightwell',
    );
  });
});
