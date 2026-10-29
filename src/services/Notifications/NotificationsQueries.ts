import { AlertVariant } from '@patternfly/react-core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import useErrorNotification from 'Hooks/useErrorNotification';
import useNotification from 'Hooks/useNotification';

import {
  getNotificationSubscriptions,
  NotificationEventTypeRequest,
  NotificationSubscriptionsResponse,
  updateNotificationSubscriptions,
} from './NotificationsApi';

export const NOTIFICATION_SUBSCRIPTIONS_KEY = 'NOTIFICATION_SUBSCRIPTIONS_KEY';

const isAffectedQuery = (eventTypeNames: string[]) => (query: { queryKey: readonly unknown[] }) => {
  const queriedEventType = query.queryKey[3] as string | undefined;
  // Match queries filtered to a specific event type, or unfiltered queries (which contain all event types)
  return !queriedEventType || eventTypeNames.includes(queriedEventType);
};

export const useNotificationSubscriptionsQuery = (
  bundle: string,
  application: string,
  shouldFetch = true,
  eventType?: string,
) =>
  useQuery({
    queryKey: [NOTIFICATION_SUBSCRIPTIONS_KEY, bundle, application, eventType],
    queryFn: () => getNotificationSubscriptions(bundle, application, eventType),
    enabled: shouldFetch,
    meta: {
      title: 'Failed to load notification preferences',
      id: 'get-notification-subscriptions-error',
    },
  });

export const useUpdateNotificationSubscriptionsMutation = (bundle: string, application: string) => {
  const queryClient = useQueryClient();
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();

  return useMutation({
    mutationFn: (eventTypes: NotificationEventTypeRequest[]) =>
      updateNotificationSubscriptions([
        {
          bundle,
          applications: [
            {
              application,
              event_types: eventTypes,
            },
          ],
        },
      ]),
    onMutate: async (eventTypes) => {
      const eventTypeNames = eventTypes.map(({ event_type }) => event_type);

      await queryClient.cancelQueries({
        queryKey: [NOTIFICATION_SUBSCRIPTIONS_KEY, bundle, application],
        predicate: isAffectedQuery(eventTypeNames),
      });

      const previousQueries = queryClient.getQueriesData<NotificationSubscriptionsResponse>({
        queryKey: [NOTIFICATION_SUBSCRIPTIONS_KEY, bundle, application],
        predicate: isAffectedQuery(eventTypeNames),
      });

      previousQueries.forEach(([queryKey, data]) => {
        if (!data) return;
        queryClient.setQueryData<NotificationSubscriptionsResponse>(
          queryKey,
          data.map((bundleGroup) => ({
            ...bundleGroup,
            applications: bundleGroup.applications.map((cachedApp) => ({
              ...cachedApp,
              event_types: cachedApp.event_types.map((cachedEventType) => {
                const update = eventTypes.find(
                  ({ event_type }) => event_type === cachedEventType.event_type,
                );
                if (!update) return cachedEventType;
                return {
                  ...cachedEventType,
                  subscriptions: cachedEventType.subscriptions.map((channel) => {
                    const updatedChannel = update.subscriptions.find(
                      ({ subscription_type }) => subscription_type === channel.subscription_type,
                    );
                    return updatedChannel
                      ? { ...channel, subscribed_severities: updatedChannel.subscribed_severities }
                      : channel;
                  }),
                };
              }),
            })),
          })),
        );
      });

      return { previousQueries, eventTypeNames };
    },
    onSuccess: (_data, _variables, context) => {
      notify({
        variant: AlertVariant.success,
        title: 'Notification preferences updated',
      });
      void queryClient.invalidateQueries({
        queryKey: [NOTIFICATION_SUBSCRIPTIONS_KEY, bundle, application],
        predicate: isAffectedQuery(context.eventTypeNames),
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any, _variables, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      errorNotifier(
        'Failed to update notification preferences',
        'Your notification preferences were not saved',
        err,
        'set-notification-subscriptions-error',
      );
    },
  });
};
