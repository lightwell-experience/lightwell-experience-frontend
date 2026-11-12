import { useState } from 'react';

import { useLightwellDemo } from 'Pages/Lightwell/LightwellDemoContext';
import { LIGHTWELL_TECH_PREVIEW_ALERT_DISMISSED_LABEL } from 'services/Lightwell/UserPreferencesApi';
import {
  useSetUserPreferenceMutation,
  useUserPreferencesQuery,
} from 'services/Lightwell/UserPreferencesQueries';

/**
 * One-time, per-user dismissal of the Technology Preview alert, stored as a user preference so it
 * holds across JavaScript repositories, reloads, and future visits.
 *
 * @param enabled - Only read preferences when the alert could show (Technology Preview repos).
 *
 * While preferences load, the alert stays hidden (no flash for users who already dismissed it).
 * If loading fails, the alert shows. Demo mode never fetches or writes; dismissal is session-only.
 */
export const useTechPreviewAlertDismissal = (enabled: boolean) => {
  const isDemo = useLightwellDemo();
  const canPersist = enabled && !isDemo;
  const [isDismissedThisSession, setIsDismissedThisSession] = useState(false);

  const preferences = useUserPreferencesQuery(canPersist);
  const { mutate } = useSetUserPreferenceMutation();

  const isDismissedPreference = !!preferences.data?.some(
    ({ label, value }) =>
      label === LIGHTWELL_TECH_PREVIEW_ALERT_DISMISSED_LABEL && value === 'true',
  );

  const isDismissed =
    isDismissedThisSession || isDismissedPreference || (canPersist && preferences.isLoading);

  const dismiss = () => {
    setIsDismissedThisSession(true);
    if (canPersist) {
      mutate({ label: LIGHTWELL_TECH_PREVIEW_ALERT_DISMISSED_LABEL, value: 'true' });
    }
  };

  return { isDismissed, dismiss };
};
