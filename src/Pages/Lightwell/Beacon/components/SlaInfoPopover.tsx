import { Button, Content } from '@patternfly/react-core';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';

import { LwPopover } from 'kit/components/assemblies';

import { SLA_POLICY_HEADER } from '../constants';

/**
 * Beacon SLA policy popover — domain component using `LwPopover`.
 * Trigger, header, and body are Beacon-specific; the popover chrome is kit.
 */
export function SlaInfoPopover() {
  return (
    <LwPopover
      hasHeader={SLA_POLICY_HEADER}
      hasBody={
        <Content>
          <p>
            <strong>Submit:</strong> Submit findings at any time.
          </p>
          <p>
            <strong>Response time:</strong> Triaged within <strong>48 hours</strong> (up to 25
            findings per member per week).
          </p>
          <p>
            <strong>Prioritize:</strong> Your severity sets the default order. Adjust at any time.
          </p>
          <p>
            <strong>Fix completion:</strong> Applied after a patched artifact is published to the
            repository or Lightwell Network.
          </p>
        </Content>
      }
      hasTrigger={
        <Button variant='plain' aria-label='SLA help' className='lightwell-help-btn'>
          <HelpIcon />
        </Button>
      }
    />
  );
}
