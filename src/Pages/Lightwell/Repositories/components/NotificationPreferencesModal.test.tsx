import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@patternfly/react-core';

import NotificationPreferencesModal from './NotificationPreferencesModal';
import { useLightwellNotificationPrefs } from '../hooks/useLightwellNotificationPrefs';
import { useSetUserPreferencesMutation } from 'services/Lightwell/UserPreferencesQueries';
import { useLightwellRepoNotifications } from '../hooks/useLightwellRepoNotifications';
import { ReactQueryTestWrapper } from 'testingHelpers';

jest.mock('../hooks/useLightwellNotificationPrefs', () => ({
  useLightwellNotificationPrefs: jest.fn(),
}));

jest.mock('services/Lightwell/UserPreferencesQueries', () => ({
  useSetUserPreferencesMutation: jest.fn(),
}));

jest.mock('../hooks/useLightwellRepoNotifications', () => ({
  ...jest.requireActual('../hooks/useLightwellRepoNotifications'),
  useLightwellRepoNotifications: jest.fn(),
}));

const mockMutateAsync = jest.fn();
const mockSyncAllSubscribedSeverities = jest.fn();

const renderModal = () =>
  render(
    <ReactQueryTestWrapper>
      <NotificationPreferencesModal>
        <Button aria-label='Notification preferences'>Notifications</Button>
      </NotificationPreferencesModal>
    </ReactQueryTestWrapper>,
  );

beforeEach(() => {
  mockMutateAsync.mockReset();
  mockSyncAllSubscribedSeverities.mockReset();
  (useSetUserPreferencesMutation as jest.Mock).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  });
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: { enabled: false, minimumSeverity: 'high' },
    isLoading: false,
    isError: false,
  });
  (useLightwellRepoNotifications as jest.Mock).mockReturnValue({
    syncAllSubscribedSeverities: mockSyncAllSubscribedSeverities,
  });
});

it('shows the form when preferences are ready', async () => {
  const user = userEvent.setup();
  renderModal();

  await user.click(screen.getByRole('button', { name: 'Notification preferences' }));

  const modal = await screen.findByRole('dialog', { name: 'Notification preferences' });
  expect(within(modal).getByRole('switch', { name: 'Email notifications' })).toBeInTheDocument();
});

it('closes the modal after a successful save', async () => {
  const user = userEvent.setup();
  mockMutateAsync.mockResolvedValue(undefined);
  renderModal();

  await user.click(screen.getByRole('button', { name: 'Notification preferences' }));
  const modal = await screen.findByRole('dialog', { name: 'Notification preferences' });

  await user.click(within(modal).getByRole('switch', { name: 'Email notifications' }));
  await user.click(within(modal).getByRole('button', { name: 'Save' }));

  await waitFor(() => {
    expect(
      screen.queryByRole('dialog', { name: 'Notification preferences' }),
    ).not.toBeInTheDocument();
  });
  expect(mockMutateAsync).toHaveBeenCalledWith({
    enabled: true,
    minimumSeverity: 'high',
  });
});

it('keeps the modal open when save fails', async () => {
  const user = userEvent.setup();
  mockMutateAsync.mockRejectedValue(new Error('save failed'));
  renderModal();

  await user.click(screen.getByRole('button', { name: 'Notification preferences' }));
  const modal = await screen.findByRole('dialog', { name: 'Notification preferences' });

  await user.click(within(modal).getByRole('switch', { name: 'Email notifications' }));
  await user.click(within(modal).getByRole('button', { name: 'Save' }));

  expect(
    await screen.findByRole('dialog', { name: 'Notification preferences' }),
  ).toBeInTheDocument();
});

it('syncs subscribed repo severities when severity changes', async () => {
  const user = userEvent.setup();
  mockMutateAsync.mockResolvedValue(undefined);
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: { enabled: true, minimumSeverity: 'high' },
    isLoading: false,
    isError: false,
  });
  renderModal();

  await user.click(screen.getByRole('button', { name: 'Notification preferences' }));
  const modal = await screen.findByRole('dialog', { name: 'Notification preferences' });

  await user.click(within(modal).getByRole('radio', { name: /Critical/i }));
  await user.click(within(modal).getByRole('button', { name: 'Save' }));

  await waitFor(() => {
    expect(mockSyncAllSubscribedSeverities).toHaveBeenCalledWith(['critical']);
  });
});

it('unsubscribes all repos when notifications are turned off', async () => {
  const user = userEvent.setup();
  mockMutateAsync.mockResolvedValue(undefined);
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: { enabled: true, minimumSeverity: 'high' },
    isLoading: false,
    isError: false,
  });
  renderModal();

  await user.click(screen.getByRole('button', { name: 'Notification preferences' }));
  const modal = await screen.findByRole('dialog', { name: 'Notification preferences' });

  await user.click(within(modal).getByRole('switch', { name: 'Email notifications' }));
  await user.click(within(modal).getByRole('button', { name: 'Save' }));

  await waitFor(() => {
    expect(mockSyncAllSubscribedSeverities).toHaveBeenCalledWith([]);
  });
});

it('does not sync subscribed repo severities when enabling notifications', async () => {
  const user = userEvent.setup();
  mockMutateAsync.mockResolvedValue(undefined);
  renderModal();

  await user.click(screen.getByRole('button', { name: 'Notification preferences' }));
  const modal = await screen.findByRole('dialog', { name: 'Notification preferences' });

  await user.click(within(modal).getByRole('switch', { name: 'Email notifications' }));
  await user.click(within(modal).getByRole('button', { name: 'Save' }));

  await waitFor(() => {
    expect(mockMutateAsync).toHaveBeenCalled();
  });
  expect(mockSyncAllSubscribedSeverities).not.toHaveBeenCalled();
});

it('shows a spinner while preferences are loading and disables Save', async () => {
  const user = userEvent.setup();
  (useLightwellNotificationPrefs as jest.Mock).mockReturnValue({
    prefs: undefined,
    isLoading: true,
    isError: false,
  });
  renderModal();

  await user.click(screen.getByRole('button', { name: 'Notification preferences' }));

  const modal = await screen.findByRole('dialog', { name: 'Notification preferences' });
  expect(within(modal).getByLabelText('Loading notification preferences')).toBeInTheDocument();
  expect(within(modal).queryByRole('switch')).not.toBeInTheDocument();
  expect(within(modal).getByRole('button', { name: 'Save' })).toBeDisabled();
});
