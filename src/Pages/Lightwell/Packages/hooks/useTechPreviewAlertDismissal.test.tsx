import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useLightwellDemo } from 'Pages/Lightwell/LightwellDemoContext';
import {
  getUserPreferences,
  LIGHTWELL_TECH_PREVIEW_ALERT_DISMISSED_LABEL,
  setUserPreference,
  type UserPreference,
} from 'services/Lightwell/UserPreferencesApi';
import { useTechPreviewAlertDismissal } from './useTechPreviewAlertDismissal';

jest.mock('services/Lightwell/UserPreferencesApi', () => ({
  ...jest.requireActual('services/Lightwell/UserPreferencesApi'),
  getUserPreferences: jest.fn(),
  setUserPreference: jest.fn(),
}));
jest.mock('Pages/Lightwell/LightwellDemoContext', () => ({ useLightwellDemo: jest.fn() }));
jest.mock('Hooks/useErrorNotification', () => () => jest.fn());
jest.mock('Hooks/useNotification', () => () => ({ notify: jest.fn() }));

/** Backend stand-in: preferences are stored per user, like the real API (org + user scoped). */
const backend = new Map<string, UserPreference[]>();
let currentUser = 'user-a';

const mockBackendForCurrentUser = () => {
  (getUserPreferences as jest.Mock).mockImplementation(async () => [
    ...(backend.get(currentUser) ?? []),
  ]);
  (setUserPreference as jest.Mock).mockImplementation(async (label: string, value: string) => {
    const prefs = (backend.get(currentUser) ?? []).filter((pref) => pref.label !== label);
    backend.set(currentUser, [...prefs, { label, value }]);
    return { label, value };
  });
};

/** A fresh QueryClient per render = a fresh page load (no cached preferences). */
const renderOnFreshPageLoad = (enabled = true) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useTechPreviewAlertDismissal(enabled), { wrapper });
};

const waitForPreferencesLoaded = () => waitFor(() => expect(getUserPreferences).toHaveBeenCalled());

beforeEach(() => {
  backend.clear();
  currentUser = 'user-a';
  jest.clearAllMocks();
  (useLightwellDemo as jest.Mock).mockReturnValue(false);
  mockBackendForCurrentUser();
});

it('shows the alert once preferences load and nothing has been dismissed', async () => {
  const { result } = renderOnFreshPageLoad();

  await waitFor(() => expect(result.current.isDismissed).toBe(false));
});

it('keeps the alert hidden while preferences are loading', () => {
  (getUserPreferences as jest.Mock).mockReturnValue(new Promise(() => undefined));

  const { result } = renderOnFreshPageLoad();

  expect(result.current.isDismissed).toBe(true);
});

it('hides the alert immediately and saves the dismissal as a user preference', async () => {
  const { result } = renderOnFreshPageLoad();
  await waitFor(() => expect(result.current.isDismissed).toBe(false));

  act(() => result.current.dismiss());

  expect(result.current.isDismissed).toBe(true);
  await waitFor(() =>
    expect(setUserPreference).toHaveBeenCalledWith(
      LIGHTWELL_TECH_PREVIEW_ALERT_DISMISSED_LABEL,
      'true',
    ),
  );
});

it('stays dismissed after a remount and a reload', async () => {
  const first = renderOnFreshPageLoad();
  await waitFor(() => expect(first.result.current.isDismissed).toBe(false));
  act(() => first.result.current.dismiss());
  await waitFor(() => expect(setUserPreference).toHaveBeenCalled());
  first.unmount();

  // Fresh client: no cache, no component state — only the stored preference.
  const reloaded = renderOnFreshPageLoad();
  await waitForPreferencesLoaded();

  await waitFor(() => expect(reloaded.result.current.isDismissed).toBe(true));
});

it('applies across JavaScript repositories (the preference is not per repository)', async () => {
  const onRepoA = renderOnFreshPageLoad();
  await waitFor(() => expect(onRepoA.result.current.isDismissed).toBe(false));
  act(() => onRepoA.result.current.dismiss());
  await waitFor(() => expect(setUserPreference).toHaveBeenCalled());
  onRepoA.unmount();

  const onRepoB = renderOnFreshPageLoad();

  await waitFor(() => expect(onRepoB.result.current.isDismissed).toBe(true));
  expect(setUserPreference).toHaveBeenCalledTimes(1);
});

it('keeps dismissal independent per user', async () => {
  const asUserA = renderOnFreshPageLoad();
  await waitFor(() => expect(asUserA.result.current.isDismissed).toBe(false));
  act(() => asUserA.result.current.dismiss());
  await waitFor(() => expect(setUserPreference).toHaveBeenCalled());
  asUserA.unmount();

  currentUser = 'user-b';
  const asUserB = renderOnFreshPageLoad();

  await waitFor(() => expect(asUserB.result.current.isDismissed).toBe(false));
});

it('shows the alert if preferences fail to load', async () => {
  (getUserPreferences as jest.Mock).mockRejectedValue(new Error('network'));

  const { result } = renderOnFreshPageLoad();

  await waitFor(() => expect(result.current.isDismissed).toBe(false));
});

it('does not read or write preferences for non-Technology Preview repositories', () => {
  renderOnFreshPageLoad(false);

  expect(getUserPreferences).not.toHaveBeenCalled();
});

it('dismisses for the session only in demo mode, without touching preferences', () => {
  (useLightwellDemo as jest.Mock).mockReturnValue(true);

  const { result } = renderOnFreshPageLoad();
  expect(result.current.isDismissed).toBe(false);

  act(() => result.current.dismiss());

  expect(result.current.isDismissed).toBe(true);
  expect(getUserPreferences).not.toHaveBeenCalled();
  expect(setUserPreference).not.toHaveBeenCalled();
});
