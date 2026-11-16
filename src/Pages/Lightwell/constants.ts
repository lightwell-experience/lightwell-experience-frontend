import {
  LIGHTWELL_NOTIFICATION_ENABLED_LABEL,
  LIGHTWELL_NOTIFICATION_MINIMUM_LABEL,
  LIGHTWELL_NOTIFICATION_SEVERITIES,
  type LightwellNotificationSeverity,
} from 'services/Lightwell/UserPreferencesApi';
import type { NotificationSubscriptionType } from 'services/Notifications/NotificationsApi';

export {
  LIGHTWELL_NOTIFICATION_ENABLED_LABEL,
  LIGHTWELL_NOTIFICATION_MINIMUM_LABEL,
  LIGHTWELL_NOTIFICATION_SEVERITIES,
  type LightwellNotificationSeverity,
};

export const INSTANT_EMAIL_SUBSCRIPTION_TYPE: NotificationSubscriptionType = 'instant_email';

export const LIGHTWELL_FEATURE_NAME =
  'lightwell-network,lightwell-clearinghouse,lightwell-research-institutions';
export const LIGHTWELL_DEMO_FEATURE_NAME = 'lightwell-network-demo';
export const LIGHTWELL_ROUTE = '/lightwell';
export const LIGHTWELL_ORIGIN = 'lightwell';
export const LIGHTWELL_USE_MOCK = false;
export const LIGHTWELL_LENS_USE_MOCK = false; // Set to true locally to skip file upload during dev
export const LIGHTWELL_BEACON_USE_MOCK = false;
export const LIGHTWELL_LENS_CATALOG_SOURCE = 'db';

export const lightwellReposPerPageKey = 'lightwellRepositoriesPerPage';
export const lightwellPkgsPerPageKey = 'lightwellPackagesPerPage';
export const lightwellCoveragePkgsPerPageKey = 'lightwellCoveragePackagesPerPage';
export const lightwellBeaconPerPageKey = 'lightwellBeaconPerPage';

// Content types whose ecosystem support is a Tech Preview (backend: config.ContentTypeNpm).
export const TECH_PREVIEW_CONTENT_TYPES = ['npm'];
export const TECH_PREVIEW_LABEL_TEXT = 'Technology Preview';
// Label popover + repository page alert (LWLP-4317).
// Titles differ; the description is shared.
export const TECH_PREVIEW_POPOVER_TITLE = 'Technology Preview repository';
export const TECH_PREVIEW_TITLE = 'This repository is in Technology Preview';
export const TECH_PREVIEW_DESCRIPTION =
  'Some packages may be removed or rebuilt. More packages will be added over time.';
export const TECH_PREVIEW_LEARN_MORE_URL =
  'https://access.redhat.com/support/offerings/techpreview';

export const CONTENT_TYPE_PARAMETERS: Record<string, { ecosystem: string }> = {
  npm: { ecosystem: 'JavaScript' },
  maven: { ecosystem: 'Java' },
  python: { ecosystem: 'Python' },
};

export const REPOSITORY_DESCRIPTIONS: Record<string, Record<string, string>> = {
  npm: {
    validated:
      'JavaScript packages rebuilt from source by Red Hat. Verified end-to-end with no modifications.',
  },
  maven: {
    validated:
      'Maven artifacts rebuilt from source by Red Hat. Verified end-to-end with no modifications.',
    remediated:
      'Maven artifacts with Red Hat backported fixes for known vulnerabilities in pinned versions.',
    predisclosure:
      'Maven artifacts with Red Hat backported fixes for vulnerabilities not yet publicly disclosed, in pinned versions.',
  },
  python: {
    validated:
      'Python wheels rebuilt from source by Red Hat. Verified end-to-end with no modifications.',
    remediated:
      'Python wheels with Red Hat backported fixes for known vulnerabilities in pinned versions.',
    predisclosure:
      'Python wheels with Red Hat backported fixes for vulnerabilities not yet publicly disclosed, in pinned versions.',
  },
};

// Long-form "About this package" descriptions shown on a package's overview tab.
// Keyed by content type then security level, mirroring REPOSITORY_DESCRIPTIONS. The
// release-suffix note differs per ecosystem (.rhlw for Maven, +rhlw for Python).
// npm ships validated only, so it has no suffix convention yet.
export const PACKAGE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  npm: {
    validated:
      'This package has been rebuilt from source by Red Hat with no modifications. Multiple upstream versions are available, each verified end-to-end through the Red Hat build pipeline.',
  },
  maven: {
    validated:
      'This package has been rebuilt from source by Red Hat with no modifications. Multiple upstream versions are available, each verified end-to-end through the Red Hat build pipeline.',
    remediated:
      'This package has been rebuilt by Red Hat with backported fixes for known vulnerabilities. The upstream version is pinned and Red Hat applies security patches as sequential releases (.rhlw suffix).',
    predisclosure:
      'This package has been rebuilt by Red Hat with backported fixes for vulnerabilities not yet publicly disclosed. The upstream version is pinned and Red Hat applies security patches as sequential releases (.rhlw suffix).',
  },
  python: {
    validated:
      'This package has been rebuilt from source by Red Hat with no modifications. Multiple upstream versions are available, each verified end-to-end through the Red Hat build pipeline.',
    remediated:
      'This package has been rebuilt by Red Hat with backported fixes for known vulnerabilities. The upstream version is pinned and Red Hat applies security patches as sequential releases (+rhlw suffix).',
    predisclosure:
      'This package has been rebuilt by Red Hat with backported fixes for vulnerabilities not yet publicly disclosed. The upstream version is pinned and Red Hat applies security patches as sequential releases (+rhlw suffix).',
  },
};

export const LIGHTWELL_PROJECT_URL = 'https://www.redhat.com/en/lightwell';

export type LightwellNotificationPrefs = {
  enabled: boolean;
  minimumSeverity: LightwellNotificationSeverity;
};

export const LIGHTWELL_VULNERABILITY_SEVERITY_OPTIONS: {
  value: LightwellNotificationSeverity;
  label: string;
}[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'Important and above' },
  { value: 'medium', label: 'Moderate and above' },
  { value: 'low', label: 'All severities' },
];

export const DEFAULT_LIGHTWELL_NOTIFICATION_PREFS: LightwellNotificationPrefs = {
  enabled: false,
  minimumSeverity: 'high',
};

export const DEMO_LIGHTWELL_NOTIFICATION_PREFS: LightwellNotificationPrefs = {
  ...DEFAULT_LIGHTWELL_NOTIFICATION_PREFS,
  enabled: true,
};
