import ExternalLinkAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';

import { LwButton, type LwPopoverProps } from 'kit/components/primitives';
import {
  TECH_PREVIEW_LEARN_MORE_URL,
  TECH_PREVIEW_DESCRIPTION,
  TECH_PREVIEW_POPOVER_TITLE,
} from './constants';

/** "Learn more" link to Red Hat's Technology Preview support scope — opens in a new tab. */
export const techPreviewLearnMoreLink = (
  <LwButton
    variant='link'
    isInline
    component='a'
    href={TECH_PREVIEW_LEARN_MORE_URL}
    target='_blank'
    rel='noopener noreferrer'
    icon={<ExternalLinkAltIcon />}
    iconPosition='end'
  >
    Learn more
  </LwButton>
);

/**
 * Domain hydration for the Technology Preview popover — spread onto `LwPopover`.
 * Call sites own the trigger (`LwLabel`, compact or not).
 */
export const techPreviewPopoverContent: Pick<
  LwPopoverProps,
  'hasHeader' | 'hasBody' | 'hasFooter'
> = {
  hasHeader: TECH_PREVIEW_POPOVER_TITLE,
  hasBody: TECH_PREVIEW_DESCRIPTION,
  hasFooter: techPreviewLearnMoreLink,
};
