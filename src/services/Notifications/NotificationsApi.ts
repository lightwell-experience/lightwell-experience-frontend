import axios from 'axios';

export type NotificationSeverity = 'critical' | 'important' | 'moderate' | 'low' | 'none';

export type NotificationSubscriptionType = 'instant_email' | 'daily_email' | 'drawer';

export interface NotificationChannel {
  subscription_type: NotificationSubscriptionType;
  subscribed_severities: NotificationSeverity[];
}

export interface NotificationEventType {
  event_type: string;
  display_name: string;
  available_severities: NotificationSeverity[];
  subscriptions: NotificationChannel[];
}

export interface NotificationApplication {
  application: string;
  application_display_name: string;
  event_types: NotificationEventType[];
}

export interface NotificationBundleGroup {
  bundle: string;
  bundle_display_name: string;
  applications: NotificationApplication[];
}

export type NotificationSubscriptionsResponse = NotificationBundleGroup[];

export interface NotificationChannelRequest {
  subscription_type: NotificationSubscriptionType;
  subscribed_severities: NotificationSeverity[];
}

export interface NotificationEventTypeRequest {
  event_type: string;
  subscriptions: NotificationChannelRequest[];
}

export interface NotificationApplicationRequest {
  application: string;
  event_types: NotificationEventTypeRequest[];
}

export interface NotificationBundleRequest {
  bundle: string;
  applications: NotificationApplicationRequest[];
}

export type NotificationSubscriptionsRequest = NotificationBundleRequest[];

export const getNotificationSubscriptions = async (
  bundle: string,
  application: string,
  eventType?: string,
): Promise<NotificationSubscriptionsResponse> => {
  const params = new URLSearchParams({ bundle, application });
  if (eventType) {
    params.set('event_type', eventType);
  }
  const { data } = await axios.get<NotificationSubscriptionsResponse>(
    `/api/notifications/v2/user-config/subscriptions?${params.toString()}`,
  );
  return data;
};

export const updateNotificationSubscriptions = async (
  body: NotificationSubscriptionsRequest,
): Promise<void> => {
  await axios.put('/api/notifications/v2/user-config/subscriptions', body);
};
