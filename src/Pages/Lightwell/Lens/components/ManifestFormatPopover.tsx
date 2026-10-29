import { Button, Content, ContentVariants, List, ListItem, Popover } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';

const ManifestFormatPopover = ({ label }: { label?: string }) => (
  <Popover
    hasAutoWidth
    maxWidth='60rem'
    position='right'
    bodyContent={
      <Content>
        <Content component='h6'>What should my manifest contain?</Content>
        <Content component={ContentVariants.p}>
          Each format must include a Package URL (PURL) so that packages can be identified.
        </Content>
        <List>
          <ListItem>
            A <strong>CSV</strong> file requires a <code>packageurl</code> column.
          </ListItem>
          <ListItem>
            <strong>CycloneDX</strong> requires a <code>purl</code> field on each entry in{' '}
            <code>components</code>.
          </ListItem>
          <ListItem>
            <strong>SPDX v2</strong> (JSON or tag:value) requires each package to include an{' '}
            <code>externalRefs</code> array entry with <code>referenceType = &quot;purl&quot;</code>{' '}
            and <code>referenceLocator</code> set to the PURL.
          </ListItem>
          <ListItem>
            <strong>SPDX v3</strong> (JSON only) requires one of the following:
            <List>
              <ListItem>
                An <code>externalIdentifier</code> array entry with{' '}
                <code>externalIdentifierType = &quot;packageUrl&quot;</code> and{' '}
                <code>identifier</code> set to the PURL.
              </ListItem>
              <ListItem>
                The <code>software_packageUrl</code> field.
              </ListItem>
            </List>
          </ListItem>
        </List>
        <Content component={ContentVariants.p}>
          The PURL format is <code>pkg:ecosystem/group/name@version</code>, for example{' '}
          <code>pkg:maven/org.springframework/spring-core@5.3.20</code>.
        </Content>
        <Content component='h6'>What is the maximum manifest size?</Content>
        <Content component={ContentVariants.p}>
          Maximum upload size is 15 MB per file. For <code>.pom</code> and <code>.xml</code> files,
          the limit is 10 MB.
        </Content>
      </Content>
    }
  >
    <Button
      variant={label ? 'link' : 'plain'}
      isInline={!!label}
      aria-label={label ?? 'More info about supported formats'}
      icon={label ? <OutlinedQuestionCircleIcon /> : undefined}
      iconPosition='end'
    >
      {label ?? <OutlinedQuestionCircleIcon />}
    </Button>
  </Popover>
);

export default ManifestFormatPopover;
