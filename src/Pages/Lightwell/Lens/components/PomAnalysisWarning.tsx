import contentStyles from '@patternfly/react-styles/css/components/Content/content';

import { LwButton, LwClipboardCopy, LwContent, LwPopover } from 'kit/components/primitives';

const GENERATE_POM_SBOM_COMMAND = 'mvn org.cyclonedx:cyclonedx-maven-plugin:2.9.1:makeAggregateBom';

const GeneratePomSbomPopover = () => (
  <LwPopover
    hasAutoWidth
    maxWidth='40rem'
    position='right'
    hasHeader='Generate an SBOM from pom.xml'
    hasBody={
      <LwContent>
        <p>
          From the directory that contains your <strong>pom.xml</strong>, run:
        </p>
        <div className={contentStyles.contentP}>
          <LwClipboardCopy isCode>{GENERATE_POM_SBOM_COMMAND}</LwClipboardCopy>
        </div>
        <p>
          Upload the generated <strong>target/bom.json</strong>.
        </p>
      </LwContent>
    }
    hasTrigger={
      <LwButton variant='link' isInline>
        How to generate an SBOM
      </LwButton>
    }
  />
);

export default GeneratePomSbomPopover;
