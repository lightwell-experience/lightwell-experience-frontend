import { useUserPreferencesQuery, UserPreference } from 'services/Lightwell/UserPreferencesQueries';
import { useAppContext } from 'middleware/AppContext';

import {
  DEMO_LIGHTWELL_NOTIFICATION_PREFS,
  LIGHTWELL_NOTIFICATION_ENABLED_LABEL,
  LIGHTWELL_NOTIFICATION_MINIMUM_LABEL,
  LIGHTWELL_NOTIFICATION_SEVERITIES,
  LightwellNotificationPrefs,
  LightwellNotificationSeverity,
} from '../../constants';
import { useLightwellDemo } from '../../LightwellDemoContext';

export const parseLightwellNotificationPrefs = (
  preferences: UserPreference[] | undefined,
): LightwellNotificationPrefs | undefined => {
  if (preferences == null || preferences.length === 0) return undefined;

  const enabledValue = preferences.find(
    ({ label }) => label === LIGHTWELL_NOTIFICATION_ENABLED_LABEL,
  )?.value;
  const minimumValue = preferences.find(
    ({ label }) => label === LIGHTWELL_NOTIFICATION_MINIMUM_LABEL,
  )?.value;

  if (
    enabledValue == null ||
    minimumValue == null ||
    !LIGHTWELL_NOTIFICATION_SEVERITIES.includes(minimumValue as LightwellNotificationSeverity)
  ) {
    return undefined;
  }

  return {
    enabled: enabledValue === 'true',
    minimumSeverity: minimumValue as LightwellNotificationSeverity,
  };
};

/**
 * @param shouldFetch - When false, the GET is disabled. Callers that gate on UI (e.g., modal open)
 * pass that flag here. Defaults to true for always-on readers (e.g., repository table).
 *
 * In demo mode, returns `DEMO_LIGHTWELL_NOTIFICATION_PREFS` without fetching. Otherwise, `prefs`
 * is undefined until data loads. Table column gate: `const showColumn = prefs?.enabled === true`.
 */
export const useLightwellNotificationPrefs = (shouldFetch = true) => {
  const isDemo = useLightwellDemo();
  const { features } = useAppContext();
  const shouldExposeNotifications = !!features?.lightwellnotifications?.accessible;
  const canFetch = shouldExposeNotifications && !isDemo && shouldFetch;

  const query = useUserPreferencesQuery(canFetch);
  const prefs = isDemo
    ? DEMO_LIGHTWELL_NOTIFICATION_PREFS
    : parseLightwellNotificationPrefs(query.data);

  return {
    prefs,
    isLoading: canFetch && query.isLoading,
    isError: canFetch && query.isError,
    shouldExposeNotifications,
  };
};
