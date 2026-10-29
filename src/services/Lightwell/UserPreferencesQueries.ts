import { AlertVariant } from '@patternfly/react-core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import useErrorNotification from 'Hooks/useErrorNotification';
import useNotification from 'Hooks/useNotification';

import {
  getUserPreferences,
  LIGHTWELL_NOTIFICATION_ENABLED_LABEL,
  LIGHTWELL_NOTIFICATION_MINIMUM_LABEL,
  LightwellNotificationSeverity,
  setUserPreference,
  UserPreference,
  UserPreferencesResponse,
} from './UserPreferencesApi';

export const USER_PREFERENCES_KEY = 'USER_PREFERENCES_KEY';

export type SetLightwellNotificationPrefsRequest = {
  enabled: boolean;
  minimumSeverity: LightwellNotificationSeverity;
};

export const useUserPreferencesQuery = (shouldFetch = true) =>
  useQuery({
    queryKey: [USER_PREFERENCES_KEY],
    queryFn: getUserPreferences,
    enabled: shouldFetch,
    meta: {
      title: 'Error loading notification preferences',
      id: 'get-user-preferences-error',
    },
  });

export const useSetUserPreferencesMutation = () => {
  const queryClient = useQueryClient();
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();

  return useMutation({
    mutationFn: async ({ enabled, minimumSeverity }: SetLightwellNotificationPrefsRequest) => {
      await setUserPreference(LIGHTWELL_NOTIFICATION_MINIMUM_LABEL, minimumSeverity);
      await setUserPreference(LIGHTWELL_NOTIFICATION_ENABLED_LABEL, enabled ? 'true' : 'false');
    },
    onMutate: async ({ enabled, minimumSeverity }) => {
      await queryClient.cancelQueries({ queryKey: [USER_PREFERENCES_KEY] });

      const previousData = queryClient.getQueryData<UserPreferencesResponse>([
        USER_PREFERENCES_KEY,
      ]);

      queryClient.setQueryData<UserPreferencesResponse>([USER_PREFERENCES_KEY], (current) => {
        const next = [...(current ?? [])];
        const upsert = (label: string, value: string) => {
          const index = next.findIndex((preference) => preference.label === label);
          const preference = { label, value };
          if (index >= 0) {
            next[index] = preference;
          } else {
            next.push(preference);
          }
        };
        upsert(LIGHTWELL_NOTIFICATION_MINIMUM_LABEL, minimumSeverity);
        upsert(LIGHTWELL_NOTIFICATION_ENABLED_LABEL, enabled ? 'true' : 'false');
        return next;
      });

      return { previousData };
    },
    onSuccess: () => {
      notify({
        variant: AlertVariant.success,
        title: 'Notification preferences saved',
      });
      void queryClient.invalidateQueries({ queryKey: [USER_PREFERENCES_KEY] });
    },
    onError: (err: unknown, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([USER_PREFERENCES_KEY], context.previousData);
      }
      errorNotifier(
        'Error saving notification preferences',
        'An error occurred',
        err,
        'set-user-preferences-error',
      );
    },
  });
};

export type { UserPreference, UserPreferencesResponse };
