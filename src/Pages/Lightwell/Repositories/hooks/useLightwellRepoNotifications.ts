import { useCallback } from 'react';

import {
  useNotificationSubscriptionsQuery,
  useUpdateNotificationSubscriptionsMutation,
} from 'services/Notifications/NotificationsQueries';
import type {
  NotificationEventTypeRequest,
  NotificationSeverity,
} from 'services/Notifications/NotificationsApi';
import { LightwellNotificationSeverity, INSTANT_EMAIL_SUBSCRIPTION_TYPE } from '../../constants';
import { useAppContext } from 'middleware/AppContext';

import { useLightwellDemo } from '../../LightwellDemoContext';

const SEVERITY_THRESHOLD_MAP: Record<LightwellNotificationSeverity, NotificationSeverity[]> = {
  critical: ['critical'],
  high: ['critical', 'important'],
  medium: ['critical', 'important', 'moderate'],
  low: ['critical', 'important', 'moderate', 'low'],
};

export const mapSeveritiesToApi = (
  threshold: LightwellNotificationSeverity,
): NotificationSeverity[] => SEVERITY_THRESHOLD_MAP[threshold];

export const useLightwellRepoNotifications = (shouldFetch = true) => {
  const isDemo = useLightwellDemo();
  const { features } = useAppContext();
  const shouldExposeNotifications = !!features?.lightwellnotifications?.accessible;
  const canFetch = shouldExposeNotifications && !isDemo && shouldFetch;

  const query = useNotificationSubscriptionsQuery('lightwell', 'lightwell', canFetch);

  const { mutate, isPending, variables } = useUpdateNotificationSubscriptionsMutation(
    'lightwell',
    'lightwell',
  );

  const isRepoSubscribed = useCallback(
    (eventType: string): boolean => {
      if (!query.data) return false;
      for (const bundle of query.data) {
        for (const app of bundle.applications) {
          const matchingEventType = app.event_types.find(
            ({ event_type }) => event_type === eventType,
          );
          if (!matchingEventType) continue;
          const emailChannel = matchingEventType.subscriptions.find(
            ({ subscription_type }) => subscription_type === INSTANT_EMAIL_SUBSCRIPTION_TYPE,
          );
          // API returns all event types regardless of subscription, so check channel severities to determine opt-in
          return (emailChannel?.subscribed_severities?.length ?? 0) > 0;
        }
      }
      return false;
    },
    [query.data],
  );

  const setRepoSubscribed = useCallback(
    (eventType: string, severities: NotificationSeverity[]) => {
      if (!canFetch) return;
      mutate([
        {
          event_type: eventType,
          subscriptions: [
            {
              subscription_type: INSTANT_EMAIL_SUBSCRIPTION_TYPE,
              subscribed_severities: severities,
            },
          ],
        },
      ]);
    },
    [canFetch, mutate],
  );

  const syncAllSubscribedSeverities = useCallback(
    (severities: NotificationSeverity[]) => {
      if (!canFetch || !query.data) return;

      const updates: NotificationEventTypeRequest[] = [];

      for (const bundle of query.data) {
        for (const app of bundle.applications) {
          for (const et of app.event_types) {
            const emailChannel = et.subscriptions.find(
              ({ subscription_type }) => subscription_type === INSTANT_EMAIL_SUBSCRIPTION_TYPE,
            );
            if ((emailChannel?.subscribed_severities?.length ?? 0) > 0) {
              updates.push({
                event_type: et.event_type,
                subscriptions: [
                  {
                    subscription_type: INSTANT_EMAIL_SUBSCRIPTION_TYPE,
                    subscribed_severities: severities,
                  },
                ],
              });
            }
          }
        }
      }

      if (updates.length > 0) {
        mutate(updates);
      }
    },
    [canFetch, query.data, mutate],
  );

  const pendingEventType = isPending ? variables?.[0]?.event_type : undefined;

  return {
    isRepoSubscribed,
    setRepoSubscribed,
    syncAllSubscribedSeverities,
    isLoading: canFetch && query.isLoading,
    isError: canFetch && query.isError,
    pendingEventType,
  };
};
