// Keys must match `$lw-ecosystem-colors` in styles/lightwell-coverage-charts.scss
export const LIGHTWELL_ECOSYSTEMS = {
  java: { label: 'Java' },
  python: { label: 'Python' },
} as const;

export type LightwellEcosystemKey = keyof typeof LIGHTWELL_ECOSYSTEMS;

export const LIGHTWELL_ECOSYSTEM_KEY_BY_LABEL = new Map<string, LightwellEcosystemKey>(
  Object.entries(LIGHTWELL_ECOSYSTEMS).map(([key, { label }]) => [
    label,
    key as LightwellEcosystemKey,
  ]),
);

export type EcosystemInfo = {
  name: string;
  supported: boolean;
};

export const formatEcosystemName = (name: string, supported: boolean): string =>
  supported ? name : `${name} (Unsupported)`;
