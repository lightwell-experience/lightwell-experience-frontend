import {
  LIGHTWELL_NOTIFICATION_ENABLED_LABEL,
  LIGHTWELL_NOTIFICATION_MINIMUM_LABEL,
} from '../../constants';
import { parseLightwellNotificationPrefs } from './useLightwellNotificationPrefs';

describe('parseLightwellNotificationPrefs', () => {
  it('returns undefined for missing or empty input', () => {
    expect(parseLightwellNotificationPrefs(undefined)).toBeUndefined();
    expect(parseLightwellNotificationPrefs([])).toBeUndefined();
  });

  it('parses valid preferences', () => {
    expect(
      parseLightwellNotificationPrefs([
        { label: LIGHTWELL_NOTIFICATION_ENABLED_LABEL, value: 'true' },
        { label: LIGHTWELL_NOTIFICATION_MINIMUM_LABEL, value: 'critical' },
      ]),
    ).toEqual({ enabled: true, minimumSeverity: 'critical' });
  });
});
