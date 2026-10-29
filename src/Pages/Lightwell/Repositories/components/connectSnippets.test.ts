import { getConnectSnippetTabs } from './connectSnippets';

it.each(['validated', 'remediated'])(
  'uses the existing Python URL behavior for %s repositories',
  (securityLevel) => {
    const indexUrl = `https://packages.redhat.com/lightwell/python/${securityLevel}/simple`;
    const tabs = getConnectSnippetTabs({
      name: `lightwell/python/${securityLevel}`,
      content_type: 'python',
      published_distribution_url: `https://packages.redhat.com/api/pulp-content/lightwell/python/${securityLevel}/`,
    });

    expect(tabs.find((tab) => tab.eventKey === 'pip')?.snippets[1].code).toBe(
      `pip config set global.index-url ${indexUrl}`,
    );
    expect(tabs.find((tab) => tab.eventKey === 'pipenv')?.snippets[1].code).toBe(
      `pipenv install --index ${indexUrl}`,
    );
    expect(tabs.find((tab) => tab.eventKey === 'poetry')?.snippets[1].code).toBe(
      `poetry source add --priority=default lightwell ${indexUrl}`,
    );
    expect(tabs.find((tab) => tab.eventKey === 'uv')?.snippets[0].code).toBe(
      'machine packages.redhat.com login <service_account_username> password <service_account_token>',
    );
    expect(tabs.find((tab) => tab.eventKey === 'uv')?.snippets[1].code).toBe(
      `system-certs = true

[[index]]
name = "lightwell"
url = "${indexUrl}"
default = true`,
    );

    expect(tabs.find((tab) => tab.eventKey === 'renovate')).toBeUndefined();
  },
);

it('documents the Java Renovate preset for remediated Maven repositories', () => {
  const tabs = getConnectSnippetTabs({
    name: 'lightwell/java/remediated',
    content_type: 'maven',
    published_distribution_url: 'https://packages.redhat.com/lightwell/java/remediated/',
  });

  const renovate = tabs.find((tab) => tab.eventKey === 'renovate');
  expect(renovate?.title).toBe('Renovate');
  expect(renovate?.docsUrl).toBe('https://github.com/lightwell-experience/renovate-config');
  expect(renovate?.snippets[0].code).toContain(
    'github>lightwell-experience/renovate-config:java-remediated#1.0.0',
  );
  expect(renovate?.snippets[0].code).not.toContain('registryUrls');
});

it('points the same Java preset at the predisclosure repository', () => {
  const tabs = getConnectSnippetTabs({
    name: 'lightwell/java/predisclosure',
    content_type: 'maven',
    published_distribution_url:
      'https://packages.redhat.com/api/pulp-content/lightwell/java/predisclosure/',
  });

  const code = tabs.find((tab) => tab.eventKey === 'renovate')?.snippets[0].code;
  expect(code).toContain('github>lightwell-experience/renovate-config:java-remediated#1.0.0');
  expect(code).toContain(
    '"registryUrls": ["https://packages.redhat.com/lightwell/java/predisclosure/"]',
  );
});

it('omits Renovate for validated Maven repositories', () => {
  const tabs = getConnectSnippetTabs({
    name: 'lightwell/java/validated',
    content_type: 'maven',
    published_distribution_url: 'https://packages.redhat.com/lightwell/java/validated/',
  });

  expect(tabs.find((tab) => tab.eventKey === 'renovate')).toBeUndefined();
});
