import { ContentItem } from 'services/Content/ContentApi';
import { formatDistributionUrl, formatPythonIndexUrl } from '../../helpers';

export interface ConnectCodeSnippet {
  label: string;
  code: string;
  urlOnly?: boolean;
  description?: string;
}

export interface ConnectSnippetTab {
  eventKey: string;
  title: string;
  snippets: ConnectCodeSnippet[];
  docsUrl?: string;
  docsLinkText?: string;
}

type RepositoryContext = Pick<ContentItem, 'name' | 'published_distribution_url' | 'content_type'>;

const RENOVATE_CONFIG_URL = 'https://github.com/lightwell-experience/renovate-config';
const JAVA_RENOVATE_PRESET = 'github>lightwell-experience/renovate-config:java-remediated#1.0.0';

const getRepositorySecurityLevel = (name: string): string | undefined => {
  if (name.includes('predisclosure')) return 'predisclosure';
  if (name.includes('remediated')) return 'remediated';
  if (name.includes('validated')) return 'validated';
  return undefined;
};

/** Same preset for remediated and predisclosure. Predisclosure only overrides registryUrls. */
const getRenovateTab = (registryUrl?: string): ConnectSnippetTab => ({
  eventKey: 'renovate',
  title: 'Renovate',
  docsUrl: RENOVATE_CONFIG_URL,
  docsLinkText: 'Lightwell Renovate config',
  snippets: [
    {
      label: 'Add a preset to renovate.json:',
      code: `{
  "extends": [
    "${JAVA_RENOVATE_PRESET}"
  ],
  "hostRules": [
    {
      "matchHost": "packages.redhat.com",
      "hostType": "maven",
      "username": "<service_account_username>",
      "password": "<service_account_token>"
    }
  ]${
    registryUrl
      ? `,
  "packageRules": [
    {
      "matchManagers": ["custom.regex"],
      "matchDatasources": ["maven"],
      "registryUrls": ["${registryUrl}"]
    }
  ]`
      : ''
  }
}`,
      description: registryUrl
        ? 'Username format: XXXXXXX|service-account-name. The java-remediated preset stays the same. registryUrls points it at this repository.'
        : 'Username format: XXXXXXX|service-account-name.',
    },
  ],
});

const getMavenRepoId = (repository: RepositoryContext): string => {
  const securityLevel = repository.name.includes('remediated') ? 'remediated' : 'validated';
  return `lightwell-${securityLevel}`;
};

const getMavenRepoName = (repository: RepositoryContext): string => {
  const securityLevel = repository.name.includes('remediated') ? 'Remediated' : 'Validated';
  return `Red Hat Lightwell Network - ${securityLevel}`;
};

const getMavenSnippetTabs = (repository: RepositoryContext): ConnectSnippetTab[] => {
  const distributionUrl = formatDistributionUrl(repository.published_distribution_url || '');
  const repoId = getMavenRepoId(repository);
  const repoName = getMavenRepoName(repository);
  const securityLevel = getRepositorySecurityLevel(repository.name);
  const renovateTab =
    securityLevel === 'remediated'
      ? getRenovateTab()
      : securityLevel === 'predisclosure'
        ? getRenovateTab(distributionUrl)
        : undefined;

  return [
    {
      eventKey: 'maven',
      title: 'Maven',
      docsUrl:
        'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_java_build_tool',
      snippets: [
        {
          label: 'Add to your settings.xml:',
          code: `<settings>
  <profiles>
    <profile>
      <id>${repoId}</id>
      <repositories>
        <repository>
          <id>${repoId}</id>
          <name>${repoName}</name>
          <url>${distributionUrl}</url>
          <releases>
            <enabled>true</enabled>
          </releases>
          <snapshots>
            <enabled>false</enabled>
          </snapshots>
        </repository>
      </repositories>
    </profile>
  </profiles>
  <activeProfiles>
    <activeProfile>${repoId}</activeProfile>
  </activeProfiles>
</settings>`,
        },
        {
          label: 'Add server credentials to your settings.xml:',
          code: `<servers>
  <server>
    <id>${repoId}</id>
    <username><service_account_username></username>
    <password><service_account_token></password>
  </server>
</servers>`,
          description: 'Username format: XXXXXXX|service-account-name',
        },
      ],
    },
    {
      eventKey: 'gradle',
      title: 'Gradle',
      docsUrl:
        'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_java_build_tool',
      snippets: [
        {
          label: 'Add to your build.gradle:',
          code: `repositories {
    maven {
        name = "${repoId}"
        url "${distributionUrl}"
        credentials {
            username = "<service_account_username>"
            password = "<service_account_token>"
        }
    }
    mavenCentral()
}`,
          description: 'Username format: XXXXXXX|service-account-name',
        },
      ],
    },
    {
      eventKey: 'artifactory',
      title: 'Artifactory',
      docsUrl:
        'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_artifactory_to_use_rhln_repository',
      snippets: [
        {
          label: 'Configure as a remote Maven repository:',
          code: distributionUrl || '',
          urlOnly: true,
          description:
            'Set as the remote URL in Artifactory. Configure basic authentication with your service account credentials.',
        },
      ],
    },
    {
      eventKey: 'nexus',
      title: 'Nexus',
      docsUrl:
        'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_nexus_to_use_rhln_repository',
      snippets: [
        {
          label: 'Configure as a Maven proxy repository:',
          code: distributionUrl || '',
          urlOnly: true,
          description:
            'Set as the remote URL in Nexus. Authentication uses mTLS client certificates.',
        },
      ],
    },
    ...(renovateTab ? [renovateTab] : []),
  ];
};

const getPythonSnippetTabs = (repository: RepositoryContext): ConnectSnippetTab[] => {
  const rawUrl = repository.published_distribution_url || '';
  const distributionUrl = formatDistributionUrl(rawUrl);
  const indexUrl = formatPythonIndexUrl(rawUrl);

  return [
    {
      eventKey: 'pip',
      title: 'pip',
      docsUrl:
        'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_python_build_tool',
      snippets: [
        {
          label: 'Add credentials to ~/.netrc:',
          code: `machine packages.redhat.com login <service_account_username> password <service_account_token>`,
          description: 'Username format: XXXXXXX|service-account-name',
        },
        {
          label: 'Set as default index:',
          code: `pip config set global.index-url ${indexUrl}`,
        },
      ],
    },
    {
      eventKey: 'pipenv',
      title: 'Pipenv',
      docsUrl:
        'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_python_build_tool',
      snippets: [
        {
          label: 'Add credentials to ~/.netrc:',
          code: `machine packages.redhat.com login <service_account_username> password <service_account_token>`,
          description: 'Username format: XXXXXXX|service-account-name',
        },
        {
          label: 'Install from the repository:',
          code: `pipenv install --index ${indexUrl}`,
        },
      ],
    },
    {
      eventKey: 'poetry',
      title: 'Poetry',
      docsUrl:
        'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_python_build_tool',
      snippets: [
        {
          label: 'Configure authentication:',
          code: `poetry config http-basic.lightwell "<service_account_username>" "<service_account_token>"`,
          description: 'Username format: XXXXXXX|service-account-name',
        },
        {
          label: 'Add as default source:',
          code: `poetry source add --priority=default lightwell ${indexUrl}`,
        },
      ],
    },
    {
      eventKey: 'uv',
      title: 'uv',
      snippets: [
        {
          label: 'Add credentials to ~/.netrc:',
          code: `machine packages.redhat.com login <service_account_username> password <service_account_token>`,
          description: 'Username format: XXXXXXX|service-account-name',
        },
        {
          label: 'Set as default index:',
          code: `system-certs = true

[[index]]
name = "lightwell"
url = "${indexUrl}"
default = true`,
          description: 'Add to ~/.config/uv/uv.toml',
        },
      ],
    },
    {
      eventKey: 'artifactory',
      title: 'Artifactory',
      docsUrl:
        'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_artifactory_to_use_rhln_repository_python',
      snippets: [
        {
          label: 'URL:',
          code: rawUrl,
          urlOnly: true,
        },
        {
          label: 'Registry URL:',
          code: distributionUrl || '',
          urlOnly: true,
        },
        {
          label: 'Registry Index Location URL Suffix:',
          code: 'simple',
          urlOnly: true,
          description:
            'Leave at the default value. Configure basic authentication with your service account credentials.',
        },
      ],
    },
    {
      eventKey: 'nexus',
      title: 'Nexus',
      docsUrl:
        'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_nexus_to_use_rhln_repository',
      snippets: [
        {
          label: 'Configure as a PyPI proxy repository:',
          code: distributionUrl || '',
          urlOnly: true,
          description:
            'Set as the remote URL in Nexus. Authentication uses mTLS client certificates.',
        },
      ],
    },
  ];
};

// TODO: add docsUrl to each tab once the JavaScript build tool docs page is published.
const getNpmSnippetTabs = (repository: RepositoryContext): ConnectSnippetTab[] => {
  const registryUrl = formatDistributionUrl(repository.published_distribution_url || '');
  // npm keys per-registry auth on the protocol-less registry URL.
  const authScope = `${registryUrl.replace(/^https?:/, '').replace(/\/+$/, '')}/`;

  return [
    {
      eventKey: 'npm',
      title: 'npm',
      snippets: [
        {
          label: 'Add credentials to ~/.npmrc:',
          code: `${authScope}:username=<service_account_username>
${authScope}:_password=<base64_service_account_token>`,
          description:
            'Username format: XXXXXXX|service-account-name. npm requires _password to be base64 encoded.',
        },
        {
          label: 'Set as default registry:',
          code: `npm config set registry ${registryUrl}`,
        },
      ],
    },
    {
      eventKey: 'yarnv1',
      title: 'Yarn v1 (Classic)',
      snippets: [
        {
          label: 'Add credentials to ~/.npmrc:',
          code: `${authScope}:_auth=<base64(service_account_username:service_account_token)>
${authScope}:always-auth=true`,
          description:
            'Username format: XXXXXXX|service-account-name. Yarn Classic (1.x) requires _auth to be base64 encoded.',
        },
      ],
    },
    {
      eventKey: 'yarnv2',
      title: 'Yarn v2+ (Berry)',
      snippets: [
        {
          label: 'Add credentials and registry to .yarnrc.yml:',
          code: `npmRegistryServer: "${registryUrl}"
npmAlwaysAuth: true
npmAuthIdent: "<service_account_username>:<service_account_token>"`,
          description:
            'Username format: XXXXXXX|service-account-name. Yarn encodes npmAuthIdent itself, so the token is not base64 encoded. Yarn Classic (1.x) reads ~/.npmrc instead — use the npm tab.',
        },
      ],
    },
    {
      eventKey: 'artifactory',
      title: 'Artifactory',
      snippets: [
        {
          label: 'Configure as a remote npm repository:',
          code: registryUrl || '',
          urlOnly: true,
          description:
            'Set as the remote URL in Artifactory. Configure basic authentication with your service account credentials.',
        },
      ],
    },
    {
      eventKey: 'nexus',
      title: 'Nexus',
      snippets: [
        {
          label: 'Configure as an npm proxy repository:',
          code: registryUrl || '',
          urlOnly: true,
          description:
            'Set as the remote URL in Nexus. Authentication uses mTLS client certificates.',
        },
      ],
    },
  ];
};

export const getConnectSnippetTabs = (repository: RepositoryContext): ConnectSnippetTab[] => {
  const contentType = repository.content_type;
  if (contentType === 'npm') {
    return getNpmSnippetTabs(repository);
  }

  if (contentType === 'maven') {
    return getMavenSnippetTabs(repository);
  }

  return getPythonSnippetTabs(repository);
};
