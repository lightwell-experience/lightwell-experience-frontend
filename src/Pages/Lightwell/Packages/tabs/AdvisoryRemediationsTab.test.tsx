import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { AdvisoryRemediationEcosystem } from '../types';
import AdvisoryRemediationsTab from './AdvisoryRemediationsTab';

const remediations: AdvisoryRemediationEcosystem[] = [
  {
    name: 'Java',
    packages: [
      {
        name: 'org.example:demo-lib',
        versionCount: 1,
        series: [
          {
            name: '3.14.x',
            versions: [{ upstreamVersion: '3.14.0', lightwellRelease: '3.14.0.rhlw-00003' }],
          },
        ],
      },
    ],
  },
  {
    name: 'Python',
    packages: [
      {
        name: 'demo-lib',
        versionCount: 1,
        series: [
          {
            name: '5.3.x',
            versions: [{ upstreamVersion: '5.3.1', lightwellRelease: '5.3.1+rhlw-00002' }],
          },
        ],
      },
    ],
  },
];

const getToggle = (rowText: string) => {
  const row = screen.getByText(rowText).closest('tr');
  expect(row).not.toBeNull();
  return within(row as HTMLElement).getByRole('button');
};

let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  user = userEvent.setup();
});

it('auto-expands search matches and restores pre-search row expansions when search clears', async () => {
  render(<AdvisoryRemediationsTab advisoryName='CVE-2022-40152' remediations={remediations} />);

  const javaPackageToggle = getToggle('org.example:demo-lib');
  expect(javaPackageToggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getAllByText('1 upstream version in 1 series')).toHaveLength(2);
  await user.click(javaPackageToggle);
  const javaSeriesToggle = getToggle('3.14.x');
  expect(screen.getAllByText('1 version')).toHaveLength(2);
  await user.click(javaSeriesToggle);
  expect(javaSeriesToggle).toHaveAttribute('aria-expanded', 'true');

  const search = screen.getByRole('textbox', { name: 'Search packages or versions' });
  await user.type(search, '5.3.1+rhlw-00002');

  expect(screen.queryByRole('heading', { name: 'Java' })).not.toBeInTheDocument();
  expect(getToggle('demo-lib')).toHaveAttribute('aria-expanded', 'true');
  expect(getToggle('5.3.x')).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('5.3.1+rhlw-00002')).toBeVisible();
  const versionTable = screen.getByRole('grid', { name: 'demo-lib 5.3.x remediations' });
  expect(within(versionTable).getAllByRole('columnheader')).toHaveLength(2);
  expect(within(versionTable).getAllByRole('cell')).toHaveLength(2);

  await user.clear(search);

  expect(getToggle('org.example:demo-lib')).toHaveAttribute('aria-expanded', 'true');
  expect(getToggle('3.14.x')).toHaveAttribute('aria-expanded', 'true');
  expect(getToggle('demo-lib')).toHaveAttribute('aria-expanded', 'false');
});

it('resets manual row collapses when the search term changes', async () => {
  render(<AdvisoryRemediationsTab advisoryName='CVE-2022-40152' remediations={remediations} />);

  const search = screen.getByRole('textbox', { name: 'Search packages or versions' });
  await user.type(search, '5.3');
  await user.click(getToggle('demo-lib'));
  expect(getToggle('demo-lib')).toHaveAttribute('aria-expanded', 'false');

  await user.type(search, '.1');
  expect(getToggle('demo-lib')).toHaveAttribute('aria-expanded', 'true');
  expect(getToggle('5.3.x')).toHaveAttribute('aria-expanded', 'true');
});
