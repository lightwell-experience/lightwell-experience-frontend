import { Flex, Icon } from '@patternfly/react-core';
import { RhUiCheckCircleFillIcon } from '@patternfly/react-icons';
import {
  t_global_background_color_100,
  t_global_border_color_status_success_default,
} from '@patternfly/react-tokens';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { type ReactNode } from 'react';

const successBorderColor = t_global_border_color_status_success_default.var;
const backgroundColor = t_global_background_color_100.var;

export const fixesCardWidth =
  'calc(394px + 4 * 2 * (var(--pf-t--global--spacer--xl) - var(--pf-t--global--spacer--lg)))';
export const fixesCardHeight =
  'calc(99px + 2 * (var(--pf-t--global--spacer--lg) - var(--pf-t--global--spacer--md)))';

type FixesCardProps = {
  children: ReactNode;
};

const FixesCard = ({ children }: FixesCardProps) => (
  <div
    data-ouia-component-id='lightwell-fixes-card'
    style={{
      position: 'relative',
      width: fixesCardWidth,
      maxWidth: '100%',
      height: `calc(${fixesCardHeight} + var(--pf-t--global--icon--size--xl) / 2)`,
    }}
  >
    <Flex
      className={spacing.pyLg}
      alignItems={{ default: 'alignItemsCenter' }}
      justifyContent={{ default: 'justifyContentSpaceEvenly' }}
      gap={{ default: 'gapNone' }}
      style={{
        height: fixesCardHeight,
        border: `1px solid ${successBorderColor}`,
        borderRadius: 'var(--pf-t--global--border--radius--medium)',
      }}
    >
      {children}
    </Flex>
    <span
      aria-hidden
      style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 5,
        lineHeight: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: '12%',
          backgroundColor,
          borderRadius: '50%',
        }}
      />
      <Icon size='xl' status='success'>
        <RhUiCheckCircleFillIcon />
      </Icon>
    </span>
  </div>
);

export default FixesCard;
