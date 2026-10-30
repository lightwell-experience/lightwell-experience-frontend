import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { CubesIcon, SearchIcon } from '@patternfly/react-icons';
import { ComponentProps, ReactNode } from 'react';

export type LightwellEmptyStateVariant = 'empty' | 'noMatch';

type LightwellEmptyStateProps = {
  variant: LightwellEmptyStateVariant;
  size?: ComponentProps<typeof EmptyState>['variant'];
  displayedItemsName?: string;
  titleText?: ReactNode;
  bodyText?: ReactNode;
  callToAction?: {
    label: string;
    onClick: () => void;
  };
};

const resolveDefaults = (variant: LightwellEmptyStateVariant, displayedItemsName?: string) => {
  if (variant === 'noMatch') {
    return {
      icon: SearchIcon,
      title: displayedItemsName ? `No ${displayedItemsName} found` : 'No results found',
      body: displayedItemsName
        ? `No ${displayedItemsName} match the filter criteria. Clear all filters and try again.`
        : 'No results match the filter criteria. Clear all filters and try again.',
    };
  }

  return {
    icon: CubesIcon,
    title: displayedItemsName ? `No ${displayedItemsName}` : 'No data',
    body: displayedItemsName ? `No ${displayedItemsName} available yet.` : 'Nothing to show yet.',
  };
};

const LightwellEmptyState = ({
  variant,
  size = EmptyStateVariant.full,
  displayedItemsName,
  titleText,
  bodyText,
  callToAction,
}: LightwellEmptyStateProps) => {
  const defaults = resolveDefaults(variant, displayedItemsName);
  const title = titleText ?? defaults.title;
  const body = bodyText ?? defaults.body;

  return (
    <EmptyState titleText={title} headingLevel='h4' icon={defaults.icon} variant={size}>
      {body ? <EmptyStateBody>{body}</EmptyStateBody> : null}
      {callToAction ? (
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button
              variant={variant === 'empty' ? 'primary' : 'link'}
              onClick={callToAction.onClick}
            >
              {callToAction.label}
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      ) : null}
    </EmptyState>
  );
};

export default LightwellEmptyState;
