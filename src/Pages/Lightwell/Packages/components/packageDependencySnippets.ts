import { formatDistributionUrl, formatPythonIndexUrl } from '../../helpers';
import { ConnectSnippetTab } from '../../Repositories/components/connectSnippets';
import { getPackageCoordinate } from '../utils/format';

interface MavenPackageSnippetInput {
  group: string;
  name: string;
  release: string;
  sourceUrl: string;
}

interface PythonPackageVersion {
  name: string;
  release: string;
  sourceUrl: string;
}

export const getPythonPackageUsageSnippetTabs = (
  pkg: PythonPackageVersion,
): ConnectSnippetTab[] => {
  const sourceUrl = formatDistributionUrl(pkg.sourceUrl);
  const indexUrl = formatPythonIndexUrl(pkg.sourceUrl);

  return [
    {
      eventKey: 'pip',
      title: 'pip',
      snippets: [
        {
          label: 'Install directly:',
          code: `# Source: ${sourceUrl}
pip install --index-url ${indexUrl} ${pkg.name}==${pkg.release}`,
        },
      ],
    },
    {
      eventKey: 'uv',
      title: 'uv',
      snippets: [
        {
          label: 'Install with uv:',
          code: `# Source: ${sourceUrl}
uv pip install --system-certs --index-url ${indexUrl} ${pkg.name}==${pkg.release}`,
        },
      ],
    },
    {
      eventKey: 'requirements.txt',
      title: 'requirements.txt',
      snippets: [
        {
          label: 'Add to your requirements.txt:',
          code: `# Source: ${sourceUrl}
--index-url ${indexUrl}
${pkg.name}==${pkg.release}`,
        },
      ],
    },
    {
      eventKey: 'pip.conf',
      title: 'pip.conf',
      snippets: [
        {
          label: 'Add to your pip.conf for permanent use:',
          code: `# ~/.config/pip/pip.conf
[global]
index-url = ${indexUrl}`,
        },
      ],
    },
  ];
};

export const getMavenPackageUsageSnippetTabs = (
  pkg: MavenPackageSnippetInput,
): ConnectSnippetTab[] => {
  const packageCoordinate = getPackageCoordinate({ ...pkg, ecosystem: 'maven' });

  return [
    {
      eventKey: 'maven',
      title: 'Maven',
      snippets: [
        {
          label: 'Add to your pom.xml:',
          code: `<!-- Source: ${pkg.sourceUrl} -->
<dependency>
  <groupId>${pkg.group}</groupId>
  <artifactId>${pkg.name}</artifactId>
  <version>${pkg.release}</version>
</dependency>`,
        },
      ],
    },
    {
      eventKey: 'gradle',
      title: 'Gradle',
      snippets: [
        {
          label: 'Add to your build.gradle:',
          code: `// Source: ${pkg.sourceUrl}
implementation("${packageCoordinate}:${pkg.release}")`,
        },
      ],
    },
  ];
};

export const getNpmPackageUsageSnippetTabs = (pkg: PythonPackageVersion): ConnectSnippetTab[] => {
  const registryUrl = formatDistributionUrl(pkg.sourceUrl);

  return [
    {
      eventKey: 'npm',
      title: 'npm',
      snippets: [
        {
          label: 'Install with npm:',
          code: `npm install ${pkg.name}@${pkg.release} --registry=${registryUrl}`,
        },
      ],
    },
    {
      eventKey: 'package.json',
      title: 'package.json',
      snippets: [
        {
          label: 'Add to package.json:',
          code: JSON.stringify({ dependencies: { [pkg.name]: pkg.release } }, null, 2),
        },
        {
          // package.json cannot carry a registry, so the adjacent .npmrc has to.
          label: 'Add .npmrc beside package.json so the dependency resolves from Lightwell:',
          code: `registry=${registryUrl}`,
        },
      ],
    },
  ];
};
