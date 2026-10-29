import { useContentListQuery } from 'services/Content/ContentQueries';
import { ContentItem } from 'services/Content/ContentApi';
import {
  LIGHTWELL_DEMO_FEATURE_NAME,
  LIGHTWELL_FEATURE_NAME,
  LIGHTWELL_USE_MOCK,
} from '../../Pages/Lightwell/constants';
import { useLightwellDemo } from '../../Pages/Lightwell/LightwellDemoContext';
import { getMockLightwellRepositoryBySlug } from '../../Pages/Lightwell/mockRepositories';
import { getRepositoryNameFromPathSlug } from '../../Pages/Lightwell/helpers';

interface UseLightwellRepositoryResult {
  repository: ContentItem | undefined;
  repoUUID: string;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}

const useLightwellRepository = (repoSlug: string): UseLightwellRepositoryResult => {
  const isDemo = useLightwellDemo();
  const repositoryName = getRepositoryNameFromPathSlug(repoSlug);
  const featureName = isDemo ? LIGHTWELL_DEMO_FEATURE_NAME : LIGHTWELL_FEATURE_NAME;

  const { data, isLoading, isError, error } = useContentListQuery(
    1,
    1,
    { feature_name: featureName, name: repositoryName },
    '',
    [],
    !!repositoryName && !LIGHTWELL_USE_MOCK,
  );

  if (LIGHTWELL_USE_MOCK) {
    const mockRepo = getMockLightwellRepositoryBySlug(repoSlug);
    return {
      repository: mockRepo,
      repoUUID: mockRepo?.uuid ?? '',
      isLoading: false,
      isError: false,
      error: undefined,
    };
  }

  const repository = data?.data[0];

  return {
    repository,
    repoUUID: repository?.uuid ?? '',
    isLoading,
    isError,
    error,
  };
};

export default useLightwellRepository;
