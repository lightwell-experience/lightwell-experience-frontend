import {
  MavenPackageVersionsListResponse,
  PythonPackageVersionsResponse,
  RepositoryPackageItem,
  RepositoryPackageReleaseInfo,
} from 'services/Content/ContentApi';

const mockPackagesByRepository: Record<string, RepositoryPackageItem[]> = {
  '33333333-3333-4333-8333-333333333333': [
    {
      name: 'protobuf',
      group: '',
      versions: ['4.25.7'],
      latest_releases: [
        { version: '4.25.7', release: 'rhlw.3', created_at: '2026-09-05T00:00:00Z' },
        { version: '4.25.7', release: 'rhlw.2', created_at: '2026-08-25T00:00:00Z' },
        { version: '4.25.7', release: 'rhlw.1', created_at: '2026-08-17T00:00:00Z' },
      ],
    },
    {
      name: 'python-requests',
      group: '',
      versions: ['2.32.5', '2.32.6'],
      latest_releases: [
        { version: '2.32.5', release: 'rhlw.1', created_at: '2026-07-01T00:00:00Z' },
        { version: '2.32.6', release: 'rhlw.1', created_at: '2026-07-01T00:00:00Z' },
      ],
    },
    {
      name: 'python-urllib3',
      group: '',
      versions: ['2.2.3'],
      latest_releases: [
        { version: '2.2.3', release: 'rhlw.1', created_at: '2026-07-01T00:00:00Z' },
      ],
    },
  ],

  // Java Validated (10 packages)
  '11111111-1111-4111-8111-111111111111': [
    {
      name: 'commons-fileupload',
      group: 'commons-fileupload',
      versions: ['2.17.2'],
      latest_releases: [{ version: '2.17.2', release: '', created_at: '2026-07-01T00:00:00Z' }],
    },
    {
      name: 'json',
      group: 'org.json',
      versions: ['3.15.0'],
      latest_releases: [{ version: '3.15.0', release: '', created_at: '2026-07-01T00:00:00Z' }],
    },
    {
      name: 'httpclient',
      group: 'org.apache.httpcomponents',
      versions: ['32.1.4'],
      latest_releases: [{ version: '32.1.4', release: '', created_at: '2026-07-01T00:00:00Z' }],
    },
    {
      name: 'guava',
      group: 'com.google.guava',
      versions: ['33.3.0', '33.2.0'],
      latest_releases: [
        { version: '33.3.0', release: '', created_at: '2026-06-20T00:00:00Z' },
        { version: '33.2.0', release: '', created_at: '2026-05-15T00:00:00Z' },
      ],
    },
    {
      name: 'commons-lang3',
      group: 'org.apache.commons',
      versions: ['3.15.0'],
      latest_releases: [{ version: '3.15.0', release: '', created_at: '2026-06-18T00:00:00Z' }],
    },
    {
      name: 'slf4j-api',
      group: 'org.slf4j',
      versions: ['2.0.16', '2.0.15'],
      latest_releases: [
        { version: '2.0.16', release: '', created_at: '2026-06-25T00:00:00Z' },
        { version: '2.0.15', release: '', created_at: '2026-05-10T00:00:00Z' },
      ],
    },
    {
      name: 'jackson-databind',
      group: 'com.fasterxml.jackson.core',
      versions: ['2.18.0', '2.17.2'],
      latest_releases: [
        { version: '2.18.0', release: '', created_at: '2026-07-05T00:00:00Z' },
        { version: '2.17.2', release: '', created_at: '2026-04-20T00:00:00Z' },
      ],
    },
    {
      name: 'logback-classic',
      group: 'ch.qos.logback',
      versions: ['1.5.8'],
      latest_releases: [{ version: '1.5.8', release: '', created_at: '2026-06-30T00:00:00Z' }],
    },
    {
      name: 'commons-io',
      group: 'commons-io',
      versions: ['2.17.0'],
      latest_releases: [{ version: '2.17.0', release: '', created_at: '2026-06-12T00:00:00Z' }],
    },
    {
      name: 'snakeyaml',
      group: 'org.yaml',
      versions: ['2.3', '2.2'],
      latest_releases: [
        { version: '2.3', release: '', created_at: '2026-06-08T00:00:00Z' },
        { version: '2.2', release: '', created_at: '2026-03-15T00:00:00Z' },
      ],
    },
  ],

  // Java Remediated (12 packages)
  '22222222-2222-4222-8222-222222222222': [
    {
      name: 'protobuf-java',
      group: 'com.google.protobuf',
      versions: ['4.25.7'],
      latest_releases: [
        { version: '4.25.7', release: 'rhlw-00003', created_at: '2026-09-03T00:00:00Z' },
        { version: '4.25.7', release: 'rhlw-00002', created_at: '2026-08-24T00:00:00Z' },
        { version: '4.25.7', release: 'rhlw-00001', created_at: '2026-08-17T00:00:00Z' },
      ],
    },
    {
      name: 'json',
      group: 'org.json',
      versions: ['20220815.0.0'],
      latest_releases: [
        { version: '20220815.0.0', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
      ],
    },
    {
      name: 'json-path',
      group: 'com.jayway.jsonpath',
      versions: ['2.9.0', '2.8.1'],
      latest_releases: [
        { version: '2.9.0', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
        { version: '2.8.1', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
      ],
    },
    {
      name: 'json-smart',
      group: 'net.minidev',
      versions: ['2.5.1', '2.4.9'],
      latest_releases: [
        { version: '2.5.1', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
        { version: '2.4.9', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
      ],
    },
    {
      name: 'log4j-core',
      group: 'org.apache.logging.log4j',
      versions: ['2.24.1'],
      latest_releases: [
        { version: '2.24.1', release: 'rhlw-00003', created_at: '2026-07-10T00:00:00Z' },
        { version: '2.24.1', release: 'rhlw-00002', created_at: '2026-06-28T00:00:00Z' },
        { version: '2.24.1', release: 'rhlw-00001', created_at: '2026-06-15T00:00:00Z' },
      ],
    },
    {
      name: 'commons-text',
      group: 'org.apache.commons',
      versions: ['1.12.1', '1.11.1'],
      latest_releases: [
        { version: '1.12.1', release: 'rhlw-00001', created_at: '2026-06-25T00:00:00Z' },
        { version: '1.11.1', release: 'rhlw-00001', created_at: '2026-05-20T00:00:00Z' },
      ],
    },
    {
      name: 'spring-core',
      group: 'org.springframework',
      versions: ['6.2.1'],
      latest_releases: [
        { version: '6.2.1', release: 'rhlw-00002', created_at: '2026-07-05T00:00:00Z' },
      ],
    },
    {
      name: 'xstream',
      group: 'com.thoughtworks.xstream',
      versions: ['1.4.21'],
      latest_releases: [
        { version: '1.4.21', release: 'rhlw-00001', created_at: '2026-06-18T00:00:00Z' },
      ],
    },
    {
      name: 'snappy-java',
      group: 'org.xerial.snappy',
      versions: ['1.1.10.6'],
      latest_releases: [
        { version: '1.1.10.6', release: 'rhlw-00001', created_at: '2026-06-15T00:00:00Z' },
      ],
    },
    {
      name: 'woodstox-core',
      group: 'com.fasterxml.woodstox',
      versions: ['6.7.1'],
      latest_releases: [
        { version: '6.7.1', release: 'rhlw-00001', created_at: '2026-06-10T00:00:00Z' },
      ],
    },
    {
      name: 'bcprov-jdk18on',
      group: 'org.bouncycastle',
      versions: ['1.79.0'],
      latest_releases: [
        { version: '1.79.0', release: 'rhlw-00001', created_at: '2026-06-05T00:00:00Z' },
      ],
    },
    {
      name: 'netty-handler',
      group: 'io.netty',
      versions: ['4.1.115', '4.1.114'],
      latest_releases: [
        { version: '4.1.115', release: 'rhlw-00002', created_at: '2026-07-12T00:00:00Z' },
        { version: '4.1.114', release: 'rhlw-00002', created_at: '2026-06-15T00:00:00Z' },
      ],
    },
  ],

  // Python Validated (10 packages)
  '44444444-4444-4444-8444-444444444444': [
    {
      name: 'flask',
      group: '',
      versions: ['3.1.1', '3.0.4'],
      latest_releases: [
        { version: '3.1.1', release: '', created_at: '2026-06-15T00:00:00Z' },
        { version: '3.0.4', release: '', created_at: '2026-05-20T00:00:00Z' },
      ],
    },
    {
      name: 'cryptography',
      group: '',
      versions: ['43.0.1', '42.0.9'],
      latest_releases: [
        { version: '43.0.1', release: '', created_at: '2026-07-01T00:00:00Z' },
        { version: '42.0.9', release: '', created_at: '2026-06-10T00:00:00Z' },
      ],
    },
    {
      name: 'pyyaml',
      group: '',
      versions: ['6.0.3'],
      latest_releases: [{ version: '6.0.3', release: '', created_at: '2026-06-28T00:00:00Z' }],
    },
    {
      name: 'requests',
      group: '',
      versions: ['2.32.4'],
      latest_releases: [{ version: '2.32.4', release: '', created_at: '2026-06-25T00:00:00Z' }],
    },
    {
      name: 'jinja2',
      group: '',
      versions: ['3.1.5', '3.1.4'],
      latest_releases: [
        { version: '3.1.5', release: '', created_at: '2026-06-20T00:00:00Z' },
        { version: '3.1.4', release: '', created_at: '2026-04-10T00:00:00Z' },
      ],
    },
    {
      name: 'pydantic',
      group: '',
      versions: ['2.9.1', '2.8.3'],
      latest_releases: [
        { version: '2.9.1', release: '', created_at: '2026-07-05T00:00:00Z' },
        { version: '2.8.3', release: '', created_at: '2026-05-30T00:00:00Z' },
      ],
    },
    {
      name: 'boto3',
      group: '',
      versions: ['1.35.12'],
      latest_releases: [{ version: '1.35.12', release: '', created_at: '2026-07-08T00:00:00Z' }],
    },
    {
      name: 'sqlalchemy',
      group: '',
      versions: ['2.0.33', '2.0.32'],
      latest_releases: [
        { version: '2.0.33', release: '', created_at: '2026-06-30T00:00:00Z' },
        { version: '2.0.32', release: '', created_at: '2026-05-25T00:00:00Z' },
      ],
    },
    {
      name: 'certifi',
      group: '',
      versions: ['2024.8.15'],
      latest_releases: [{ version: '2024.8.15', release: '', created_at: '2026-07-04T00:00:00Z' }],
    },
    {
      name: 'pillow',
      group: '',
      versions: ['10.5.0', '10.4.1'],
      latest_releases: [
        { version: '10.5.0', release: '', created_at: '2026-06-22T00:00:00Z' },
        { version: '10.4.1', release: '', created_at: '2026-04-15T00:00:00Z' },
      ],
    },
  ],
};

export const getMockLightwellPackages = (
  repoUUID: string,
  search = '',
): RepositoryPackageItem[] => {
  const normalizedUuid = decodeURIComponent(repoUUID);
  const packages = mockPackagesByRepository[normalizedUuid] ?? [];
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return packages;
  }

  return packages.filter(
    (pkg) =>
      pkg.name.toLowerCase().includes(normalizedSearch) ||
      pkg.group.toLowerCase().includes(normalizedSearch),
  );
};

export const getMockLightwellRepositoryPackageCounts = (
  repoUuids: string[],
): Record<string, number> =>
  Object.fromEntries(repoUuids.map((uuid) => [uuid, getMockLightwellPackages(uuid).length]));

const mavenValidatedDetail = (
  group: string,
  name: string,
  version: string,
  summary: string,
  license: string,
  author: string,
  projectUrl: string,
): MavenPackageVersionsListResponse => ({
  group,
  name,
  versions: [
    { group, name, version, builds: [], summary, license, project_url: projectUrl, author },
  ],
});

const mavenRemediatedDetail = (
  group: string,
  name: string,
  versions: { version: string; created_at: string }[],
  summary: string,
  license: string,
  projectUrl: string,
): MavenPackageVersionsListResponse => ({
  group,
  name,
  versions: versions.map((v) => ({
    group,
    name,
    version: v.version,
    builds: [{ version: v.version, release: 'rhlw-00001', created_at: v.created_at }],
    summary,
    license,
    project_url: projectUrl,
    author: 'Red Hat',
  })),
});

const mockMavenVersionsListByRepo: Record<
  string,
  Record<string, MavenPackageVersionsListResponse>
> = {
  // Java Validated
  '11111111-1111-4111-8111-111111111111': {
    'commons-fileupload:commons-fileupload': mavenValidatedDetail(
      'commons-fileupload',
      'commons-fileupload',
      '2.17.2',
      'A simple yet flexible means of adding multipart file upload support to servlets and web applications.',
      'Apache-2.0',
      'Apache Software Foundation',
      'https://commons.apache.org/proper/commons-fileupload/',
    ),
    'org.json:json': mavenValidatedDetail(
      'org.json',
      'json',
      '3.15.0',
      'A light-weight, language independent, data interchange format.',
      'JSON',
      'Douglas Crockford',
      'https://github.com/stleary/JSON-java',
    ),
    'org.apache.httpcomponents:httpclient': mavenValidatedDetail(
      'org.apache.httpcomponents',
      'httpclient',
      '32.1.4',
      'An efficient, up-to-date, and feature-rich HTTP client library.',
      'Apache-2.0',
      'Apache Software Foundation',
      'https://hc.apache.org/httpcomponents-client-5.4.x/',
    ),
    'com.google.guava:guava': mavenValidatedDetail(
      'com.google.guava',
      'guava',
      '33.3.0',
      'Google core libraries for Java including collections, caching, primitives, concurrency, I/O, and more.',
      'Apache-2.0',
      'Google LLC',
      'https://github.com/google/guava',
    ),
    'org.apache.commons:commons-lang3': mavenValidatedDetail(
      'org.apache.commons',
      'commons-lang3',
      '3.15.0',
      'Provides extra functionality for classes in java.lang.',
      'Apache-2.0',
      'Apache Software Foundation',
      'https://commons.apache.org/proper/commons-lang/',
    ),
    'org.slf4j:slf4j-api': mavenValidatedDetail(
      'org.slf4j',
      'slf4j-api',
      '2.0.16',
      'Simple Logging Facade for Java — serves as a simple abstraction for various logging frameworks.',
      'MIT',
      'QOS.ch',
      'https://www.slf4j.org/',
    ),
    'com.fasterxml.jackson.core:jackson-databind': mavenValidatedDetail(
      'com.fasterxml.jackson.core',
      'jackson-databind',
      '2.18.0',
      'General data-binding functionality for Jackson: works on core streaming API.',
      'Apache-2.0',
      'FasterXML',
      'https://github.com/FasterXML/jackson-databind',
    ),
    'ch.qos.logback:logback-classic': mavenValidatedDetail(
      'ch.qos.logback',
      'logback-classic',
      '1.5.8',
      'Logback classic module, a reliable, generic, fast and flexible logging framework.',
      'EPL-1.0 OR LGPL-2.1',
      'QOS.ch',
      'https://logback.qos.ch/',
    ),
    'commons-io:commons-io': mavenValidatedDetail(
      'commons-io',
      'commons-io',
      '2.17.0',
      'A library of utilities to assist with developing IO functionality.',
      'Apache-2.0',
      'Apache Software Foundation',
      'https://commons.apache.org/proper/commons-io/',
    ),
    'org.yaml:snakeyaml': mavenValidatedDetail(
      'org.yaml',
      'snakeyaml',
      '2.3',
      'YAML 1.1 parser and emitter for Java.',
      'Apache-2.0',
      'Andrey Somov',
      'https://bitbucket.org/snakeyaml/snakeyaml',
    ),
  },

  // Java Remediated
  '22222222-2222-4222-8222-222222222222': {
    'com.google.protobuf:protobuf-java': {
      group: 'com.google.protobuf',
      name: 'protobuf-java',
      versions: [
        {
          group: 'com.google.protobuf',
          name: 'protobuf-java',
          version: '4.25.7',
          builds: [
            { version: '4.25.7', release: 'rhlw-00003', created_at: '2026-09-03T00:00:00Z' },
            { version: '4.25.7', release: 'rhlw-00002', created_at: '2026-08-24T00:00:00Z' },
            { version: '4.25.7', release: 'rhlw-00001', created_at: '2026-08-17T00:00:00Z' },
          ],
          summary: 'Protocol Buffers runtime for Java applications.',
          license: 'BSD-3-Clause',
          project_url: 'https://github.com/protocolbuffers/protobuf',
          author: 'Red Hat',
        },
      ],
    },
    'org.json:json': mavenRemediatedDetail(
      'org.json',
      'json',
      [{ version: '20220815.0.0', created_at: '2026-07-01T00:00:00Z' }],
      'A light-weight, language independent, data interchange format.',
      'JSON',
      'https://github.com/stleary/JSON-java',
    ),
    'com.jayway.jsonpath:json-path': mavenRemediatedDetail(
      'com.jayway.jsonpath',
      'json-path',
      [
        { version: '2.9.0', created_at: '2026-07-01T00:00:00Z' },
        { version: '2.8.1', created_at: '2026-06-15T00:00:00Z' },
      ],
      'Java JsonPath implementation for reading and writing JSON documents.',
      'Apache-2.0',
      'https://github.com/json-path/JsonPath',
    ),
    'net.minidev:json-smart': mavenRemediatedDetail(
      'net.minidev',
      'json-smart',
      [
        { version: '2.5.1', created_at: '2026-07-01T00:00:00Z' },
        { version: '2.4.9', created_at: '2026-06-20T00:00:00Z' },
      ],
      'JSON Small and Fast Parser — a high-performance JSON processor.',
      'Apache-2.0',
      'https://urielch.github.io/',
    ),
    'org.apache.logging.log4j:log4j-core': {
      group: 'org.apache.logging.log4j',
      name: 'log4j-core',
      versions: [
        {
          group: 'org.apache.logging.log4j',
          name: 'log4j-core',
          version: '2.24.1',
          builds: [
            {
              version: '2.24.1',
              release: 'rhlw-00003',
              created_at: '2026-07-10T00:00:00Z',
            },
            {
              version: '2.24.1',
              release: 'rhlw-00002',
              created_at: '2026-06-28T00:00:00Z',
            },
            {
              version: '2.24.1',
              release: 'rhlw-00001',
              created_at: '2026-06-15T00:00:00Z',
            },
          ],
          summary: 'The Apache Log4j Implementation.',
          license: 'Apache-2.0',
          project_url: 'https://logging.apache.org/log4j/2.x/',
          author: 'Red Hat',
        },
      ],
    },
    'org.apache.commons:commons-text': mavenRemediatedDetail(
      'org.apache.commons',
      'commons-text',
      [
        { version: '1.12.1', created_at: '2026-06-25T00:00:00Z' },
        { version: '1.11.1', created_at: '2026-05-20T00:00:00Z' },
      ],
      'A library focused on algorithms working on strings.',
      'Apache-2.0',
      'https://commons.apache.org/proper/commons-text/',
    ),
    'org.springframework:spring-core': {
      group: 'org.springframework',
      name: 'spring-core',
      versions: [
        {
          group: 'org.springframework',
          name: 'spring-core',
          version: '6.2.1',
          builds: [
            {
              version: '6.2.1',
              release: 'rhlw-00002',
              created_at: '2026-07-05T00:00:00Z',
            },
            {
              version: '6.2.1',
              release: 'rhlw-00001',
              created_at: '2026-06-22T00:00:00Z',
            },
          ],
          summary:
            'Spring Framework core support, including dependency injection and type conversion.',
          license: 'Apache-2.0',
          project_url: 'https://spring.io/projects/spring-framework',
          author: 'Red Hat',
        },
      ],
    },
    'com.thoughtworks.xstream:xstream': mavenRemediatedDetail(
      'com.thoughtworks.xstream',
      'xstream',
      [{ version: '1.4.21', created_at: '2026-06-18T00:00:00Z' }],
      'XStream is a simple library to serialize objects to XML and back again.',
      'BSD-3-Clause',
      'https://x-stream.github.io/',
    ),
    'org.xerial.snappy:snappy-java': mavenRemediatedDetail(
      'org.xerial.snappy',
      'snappy-java',
      [{ version: '1.1.10.6', created_at: '2026-06-15T00:00:00Z' }],
      'Snappy compressor/decompressor for Java.',
      'Apache-2.0',
      'https://github.com/xerial/snappy-java',
    ),
    'com.fasterxml.woodstox:woodstox-core': mavenRemediatedDetail(
      'com.fasterxml.woodstox',
      'woodstox-core',
      [{ version: '6.7.1', created_at: '2026-06-10T00:00:00Z' }],
      'Woodstox is a high-performance XML processor that implements StAX, SAX, and Stax2 APIs.',
      'Apache-2.0',
      'https://github.com/FasterXML/woodstox',
    ),
    'org.bouncycastle:bcprov-jdk18on': mavenRemediatedDetail(
      'org.bouncycastle',
      'bcprov-jdk18on',
      [{ version: '1.79.0', created_at: '2026-06-05T00:00:00Z' }],
      'The Bouncy Castle Crypto package is a Java implementation of cryptographic algorithms.',
      'MIT',
      'https://www.bouncycastle.org/java.html',
    ),
    'io.netty:netty-handler': {
      group: 'io.netty',
      name: 'netty-handler',
      versions: [
        {
          group: 'io.netty',
          name: 'netty-handler',
          version: '4.1.115',
          builds: [
            {
              version: '4.1.115',
              release: 'rhlw-00002',
              created_at: '2026-07-12T00:00:00Z',
            },
            {
              version: '4.1.115',
              release: 'rhlw-00001',
              created_at: '2026-07-03T00:00:00Z',
            },
          ],
          summary:
            'Netty is an asynchronous event-driven network application framework for rapid development.',
          license: 'Apache-2.0',
          project_url: 'https://netty.io/',
          author: 'Red Hat',
        },
        {
          group: 'io.netty',
          name: 'netty-handler',
          version: '4.1.114',
          builds: [
            {
              version: '4.1.114',
              release: 'rhlw-00002',
              created_at: '2026-06-15T00:00:00Z',
            },
            {
              version: '4.1.114',
              release: 'rhlw-00001',
              created_at: '2026-06-01T00:00:00Z',
            },
          ],
          summary:
            'Netty is an asynchronous event-driven network application framework for rapid development.',
          license: 'Apache-2.0',
          project_url: 'https://netty.io/',
          author: 'Red Hat',
        },
      ],
    },
  },
};

export const getMockMavenPackageVersionsList = (
  repoUUID: string,
  group: string,
  name: string,
): MavenPackageVersionsListResponse | undefined => {
  const key = `${group}:${name}`;
  return mockMavenVersionsListByRepo[repoUUID]?.[key];
};

const pythonPackageDetail = (
  name: string,
  versions: {
    version: string;
    last_updated: string;
    builds?: RepositoryPackageReleaseInfo[];
  }[],
  summary: string,
  license: string,
  authorName: string,
  projectUrl: string,
): PythonPackageVersionsResponse => ({
  name,
  versions: versions.map((v) => ({
    name,
    version: v.version,
    builds: v.builds ?? [{ version: v.version, release: '', created_at: v.last_updated }],
    summary,
    description: summary,
    last_updated: v.last_updated,
    license,
    author: { name: authorName },
    upstream_versions: [v.version],
    project_url: projectUrl,
    distributions: [],
  })),
});

const mockPythonVersionsByRepo: Record<string, Record<string, PythonPackageVersionsResponse>> = {
  // Python Remediated
  '33333333-3333-4333-8333-333333333333': {
    protobuf: pythonPackageDetail(
      'protobuf',
      [
        {
          version: '4.25.7',
          last_updated: '2026-09-05T00:00:00Z',
          builds: [
            { version: '4.25.7', release: 'rhlw.3', created_at: '2026-09-05T00:00:00Z' },
            { version: '4.25.7', release: 'rhlw.2', created_at: '2026-08-25T00:00:00Z' },
            { version: '4.25.7', release: 'rhlw.1', created_at: '2026-08-17T00:00:00Z' },
          ],
        },
      ],
      'Protocol Buffers runtime for Python applications.',
      'BSD-3-Clause',
      'Google',
      'https://github.com/protocolbuffers/protobuf',
    ),
    'python-requests': pythonPackageDetail(
      'python-requests',
      [
        {
          version: '2.32.6',
          last_updated: '2026-07-01T00:00:00Z',
          builds: [{ version: '2.32.6', release: 'rhlw.1', created_at: '2026-07-01T00:00:00Z' }],
        },
        {
          version: '2.32.5',
          last_updated: '2026-07-01T00:00:00Z',
          builds: [{ version: '2.32.5', release: 'rhlw.1', created_at: '2026-07-01T00:00:00Z' }],
        },
      ],
      'Python HTTP library.',
      'Apache-2.0',
      'Kenneth Reitz',
      'https://requests.readthedocs.io/',
    ),
    'python-urllib3': pythonPackageDetail(
      'python-urllib3',
      [
        {
          version: '2.2.3',
          last_updated: '2026-07-01T00:00:00Z',
          builds: [{ version: '2.2.3', release: 'rhlw.1', created_at: '2026-07-01T00:00:00Z' }],
        },
      ],
      'HTTP library with thread-safe connection pooling.',
      'MIT',
      'Andrey Petrov',
      'https://urllib3.readthedocs.io/',
    ),
  },
  // Python Validated
  '44444444-4444-4444-8444-444444444444': {
    flask: pythonPackageDetail(
      'flask',
      [
        { version: '3.1.1', last_updated: '2026-06-15T00:00:00Z' },
        { version: '3.0.4', last_updated: '2026-05-20T00:00:00Z' },
      ],
      'A simple framework for building complex web applications.',
      'BSD-3-Clause',
      'Pallets',
      'https://flask.palletsprojects.com/',
    ),
    cryptography: pythonPackageDetail(
      'cryptography',
      [
        { version: '43.0.1', last_updated: '2026-07-01T00:00:00Z' },
        { version: '42.0.9', last_updated: '2026-06-10T00:00:00Z' },
      ],
      'Cryptographic recipes and primitives for Python developers.',
      'Apache-2.0 OR BSD-3-Clause',
      'The cryptography developers',
      'https://github.com/pyca/cryptography',
    ),
    pyyaml: pythonPackageDetail(
      'pyyaml',
      [{ version: '6.0.3', last_updated: '2026-06-28T00:00:00Z' }],
      'YAML parser and emitter for Python.',
      'MIT',
      'Kirill Simonov',
      'https://pyyaml.org/',
    ),
    requests: pythonPackageDetail(
      'requests',
      [{ version: '2.32.4', last_updated: '2026-06-25T00:00:00Z' }],
      'A simple, yet elegant, HTTP library.',
      'Apache-2.0',
      'Kenneth Reitz',
      'https://requests.readthedocs.io/',
    ),
    jinja2: pythonPackageDetail(
      'jinja2',
      [
        { version: '3.1.5', last_updated: '2026-06-20T00:00:00Z' },
        { version: '3.1.4', last_updated: '2026-04-10T00:00:00Z' },
      ],
      'A small but fast and easy to use stand-alone template engine.',
      'BSD-3-Clause',
      'Pallets',
      'https://jinja.palletsprojects.com/',
    ),
    pydantic: pythonPackageDetail(
      'pydantic',
      [
        { version: '2.9.1', last_updated: '2026-07-05T00:00:00Z' },
        { version: '2.8.3', last_updated: '2026-05-30T00:00:00Z' },
      ],
      'Data validation using Python type annotations.',
      'MIT',
      'Samuel Colvin',
      'https://docs.pydantic.dev/',
    ),
    boto3: pythonPackageDetail(
      'boto3',
      [{ version: '1.35.12', last_updated: '2026-07-08T00:00:00Z' }],
      'The AWS SDK for Python.',
      'Apache-2.0',
      'Amazon Web Services',
      'https://boto3.amazonaws.com/v1/documentation/api/latest/index.html',
    ),
    sqlalchemy: pythonPackageDetail(
      'sqlalchemy',
      [
        { version: '2.0.33', last_updated: '2026-06-30T00:00:00Z' },
        { version: '2.0.32', last_updated: '2026-05-25T00:00:00Z' },
      ],
      'Database abstraction library for Python.',
      'MIT',
      'Mike Bayer',
      'https://www.sqlalchemy.org/',
    ),
    certifi: pythonPackageDetail(
      'certifi',
      [{ version: '2024.8.15', last_updated: '2026-07-04T00:00:00Z' }],
      'Python package for providing Mozilla CA Bundle.',
      'MPL-2.0',
      'Kenneth Reitz',
      'https://github.com/certifi/python-certifi',
    ),
    pillow: pythonPackageDetail(
      'pillow',
      [
        { version: '10.5.0', last_updated: '2026-06-22T00:00:00Z' },
        { version: '10.4.1', last_updated: '2026-04-15T00:00:00Z' },
      ],
      'Python Imaging Library (fork).',
      'MIT-CMU',
      'Jeffrey A. Clark',
      'https://python-pillow.org/',
    ),
  },
};

export const getMockPythonPackageVersions = (
  repoUUID: string,
  name: string,
): PythonPackageVersionsResponse | undefined => mockPythonVersionsByRepo[repoUUID]?.[name];
