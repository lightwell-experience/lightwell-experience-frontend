import {
  getNpmPackageUsageSnippetTabs,
  getPythonPackageUsageSnippetTabs,
} from './packageDependencySnippets';

it.each([
  ['validated', '2.21.2'],
  ['remediated', '3.0.1+rhlw.2'],
])('keeps the Python snippet URLs for %s packages', (securityLevel, version) => {
  const sourceUrl = `https://packages.redhat.com/lightwell/python/${securityLevel}/`;
  const indexUrl = `https://packages.redhat.com/lightwell/python/${securityLevel}/simple`;
  const tabs = getPythonPackageUsageSnippetTabs({
    name: 'lightwell-fixture',
    release: version,
    sourceUrl: sourceUrl.replace(/\/$/, ''),
  });

  expect(tabs.find((tab) => tab.eventKey === 'pip')?.snippets[0].code).toContain(
    `pip install --index-url ${indexUrl} lightwell-fixture==${version}`,
  );
  expect(tabs.find((tab) => tab.eventKey === 'uv')?.snippets[0].code).toContain(
    `uv pip install --system-certs --index-url ${indexUrl} lightwell-fixture==${version}`,
  );
  expect(tabs.find((tab) => tab.eventKey === 'requirements.txt')?.snippets[0].code).toContain(
    `--index-url ${indexUrl}\nlightwell-fixture==${version}`,
  );
  expect(tabs.find((tab) => tab.eventKey === 'pip.conf')?.snippets[0].code).toContain(
    `index-url = ${indexUrl}`,
  );
});

it.each(['validated', 'remediated'])(
  'adds one slash before simple for %s packages with a trailing slash',
  (securityLevel) => {
    const sourceUrl = `https://packages.redhat.com/lightwell/python/${securityLevel}/`;
    const indexUrl = `https://packages.redhat.com/lightwell/python/${securityLevel}/simple`;
    const tabs = getPythonPackageUsageSnippetTabs({
      name: 'lightwell-fixture',
      release: '3.0.1+rhlw.2',
      sourceUrl,
    });

    expect(tabs.find((tab) => tab.eventKey === 'pip')?.snippets[0].code).toContain(
      `pip install --index-url ${indexUrl} lightwell-fixture==3.0.1+rhlw.2`,
    );
    expect(tabs.find((tab) => tab.eventKey === 'uv')?.snippets[0].code).toContain(
      `uv pip install --system-certs --index-url ${indexUrl} lightwell-fixture==3.0.1+rhlw.2`,
    );
  },
);

it('pins the npm install command to the registry and the package.json entry to the version', () => {
  const tabs = getNpmPackageUsageSnippetTabs({
    name: '@types/node',
    release: '1.0.0',
    sourceUrl: 'https://packages.redhat.com/api/pulp-content/lightwell/javascript/validated/',
  });

  expect(tabs.map((tab) => tab.eventKey)).toEqual(['npm', 'package.json']);
  expect(tabs[0].snippets[0].code).toBe(
    'npm install @types/node@1.0.0 --registry=https://packages.redhat.com/lightwell/javascript/validated/',
  );
  expect(JSON.parse(tabs[1].snippets[0].code)).toEqual({
    dependencies: { '@types/node': '1.0.0' },
  });
  expect(tabs[1].snippets[1].code).toBe(
    'registry=https://packages.redhat.com/lightwell/javascript/validated/',
  );
});
