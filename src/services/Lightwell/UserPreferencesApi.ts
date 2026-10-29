import axios from 'axios';

export type UserPreference = {
  label: string;
  value: string;
};

export type UserPreferencesResponse = UserPreference[];

export const LIGHTWELL_NOTIFICATION_ENABLED_LABEL = 'lightwell-notification-enabled';
export const LIGHTWELL_NOTIFICATION_MINIMUM_LABEL = 'lightwell-notification-minimum';
export const LIGHTWELL_NOTIFICATION_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

export type LightwellNotificationSeverity = (typeof LIGHTWELL_NOTIFICATION_SEVERITIES)[number];

export const getUserPreferences = async (): Promise<UserPreferencesResponse> => {
  const { data } = await axios.get<UserPreferencesResponse>(
    '/api/content-sources/v1/user_preferences/',
  );
  return data;
};

export const setUserPreference = async (label: string, value: string): Promise<UserPreference> => {
  const { data } = await axios.put<UserPreference>(
    `/api/content-sources/v1/user_preferences/${encodeURIComponent(label)}`,
    JSON.stringify(value),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return data;
};
