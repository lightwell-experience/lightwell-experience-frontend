import {
  Button,
  ClipboardCopy,
  ClipboardCopyVariant,
  Content,
  Flex,
  FlexItem,
  Tab,
  TabContent,
  Tabs,
  TabTitleText,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { createRef, useEffect, useMemo, useState } from 'react';

import { ContentItem } from 'services/Content/ContentApi';

import { ConnectSnippetTab, getConnectSnippetTabs } from './connectSnippets';

type ConnectRepositoryContentProps = {
  repository: Pick<ContentItem, 'name' | 'published_distribution_url' | 'content_type' | 'uuid'>;
};

const renderTabPanel = (tab: ConnectSnippetTab) => (
  <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
    {tab.snippets.map((snippet) => (
      <FlexItem key={snippet.label}>
        <Content component='p' style={{ textAlign: 'left' }}>
          {snippet.label}
        </Content>
        <ClipboardCopy
          isReadOnly
          isCode
          hoverTip='Copy'
          clickTip='Copied'
          variant={snippet.urlOnly ? ClipboardCopyVariant.inline : ClipboardCopyVariant.expansion}
          isExpanded={snippet.urlOnly ? false : snippet.code.split('\n').length > 1 ? true : false}
        >
          {snippet.code}
        </ClipboardCopy>
        {snippet.description && (
          <Content component='small' className={spacing.mtSm} style={{ textAlign: 'left' }}>
            {snippet.description}
          </Content>
        )}
      </FlexItem>
    ))}
    {tab.docsUrl && (
      <FlexItem>
        <Button
          variant='link'
          isInline
          component='a'
          href={tab.docsUrl}
          target='_blank'
          rel='noopener noreferrer'
          icon={<ExternalLinkAltIcon />}
          iconPosition='end'
        >
          {tab.docsLinkText ?? `View full documentation for ${tab.title}`}
        </Button>
      </FlexItem>
    )}
  </Flex>
);

const ConnectRepositoryContent = ({ repository }: ConnectRepositoryContentProps) => {
  const tabs = useMemo(() => getConnectSnippetTabs(repository), [repository]);
  const firstTabKey = tabs[0]?.eventKey ?? '';
  const [activeTabKey, setActiveTabKey] = useState(firstTabKey);

  const tabRefs = useMemo(
    () =>
      tabs.reduce(
        (refs, tab) => {
          refs[tab.eventKey] = createRef<HTMLElement>();
          return refs;
        },
        {} as Record<string, React.RefObject<HTMLElement>>,
      ),
    [tabs],
  );

  useEffect(() => {
    setActiveTabKey(firstTabKey);
  }, [firstTabKey, repository.uuid]);

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
      <FlexItem>
        <Content component='h4' className={spacing.mbSm}>
          Authenticate build tools
        </Content>
        <Content component='p'>
          {'Create or access your '}
          <Button
            variant='link'
            isInline
            component='a'
            href='https://access.redhat.com/terms-based-registry/'
            target='_blank'
            rel='noopener noreferrer'
            icon={<ExternalLinkAltIcon />}
            iconPosition='end'
            style={{ fontWeight: 'bold' }}
          >
            Lightwell service account
          </Button>
          .
        </Content>
      </FlexItem>
      <FlexItem>
        <Content component='h4' className={spacing.mbSm}>
          Connect to your build tool
        </Content>
        <Content component='p' className={spacing.mbMd}>
          {'Insert your username and token into the configuration snippets. '}
          <Button
            variant='link'
            isInline
            component='a'
            href='https://docs.redhat.com/en/documentation/red_hat_lightwell_network/'
            target='_blank'
            rel='noopener noreferrer'
            icon={<ExternalLinkAltIcon />}
            iconPosition='end'
          >
            Learn more about Lightwell Network
          </Button>
        </Content>
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_, eventKey) => setActiveTabKey(eventKey as string)}
          aria-label='Connect repository snippets'
          ouiaId='lightwell-connect-snippets-tabs'
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.eventKey}
              eventKey={tab.eventKey}
              title={<TabTitleText>{tab.title}</TabTitleText>}
              tabContentRef={tabRefs[tab.eventKey]}
              ouiaId={`lightwell-connect-tab-${tab.eventKey}`}
            />
          ))}
        </Tabs>
        {tabs.map((tab, index) => (
          <TabContent
            key={tab.eventKey}
            eventKey={tab.eventKey}
            id={`lightwell-connect-panel-${tab.eventKey}`}
            aria-label={tab.title}
            ref={tabRefs[tab.eventKey]}
            hidden={index > 0}
            className={spacing.ptMd}
          >
            {renderTabPanel(tab)}
          </TabContent>
        ))}
      </FlexItem>
    </Flex>
  );
};

export default ConnectRepositoryContent;
