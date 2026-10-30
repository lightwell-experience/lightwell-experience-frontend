import { Tbody, Tr, Td } from '@patternfly/react-table';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateActions,
  Button,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { CubesIcon, RepositoryIcon } from '@patternfly/react-icons';
import { OUIAProps } from '@patternfly/react-core/helpers';
import React from 'react';

interface Props extends OUIAProps {
  variant?: 'zero' | 'filtered';
  itemName: string;
  colSpan: number;
  zeroBody?: string;
  actions?: React.ReactNode;
  onClearFilters?: () => void;
}

const EmptyTableDataView = ({
  itemName,
  variant = 'filtered', // Dominant use case
  ouiaId,
  onClearFilters,
  colSpan,
  zeroBody,
  actions,
}: Props) => {
  const isFiltered = variant === 'filtered';

  return (
    <Tbody>
      <Tr key='empty' ouiaId={`${ouiaId}-tr-empty`}>
        <Td colSpan={colSpan}>
          <EmptyState
            icon={isFiltered ? CubesIcon : RepositoryIcon}
            titleText={isFiltered ? `No ${itemName} match the filter criteria` : `No ${itemName}`}
            variant={EmptyStateVariant.full}
            headingLevel='h4'
          >
            <EmptyStateBody>
              {isFiltered ? 'Clear all filters to show more results.' : zeroBody}
            </EmptyStateBody>
            <EmptyStateFooter>
              {isFiltered ? (
                <EmptyStateActions>
                  <Button variant='primary' ouiaId='clear_filters' onClick={onClearFilters}>
                    Clear all filters
                  </Button>
                </EmptyStateActions>
              ) : (
                actions
              )}
            </EmptyStateFooter>
          </EmptyState>
        </Td>
      </Tr>
    </Tbody>
  );
};

export default EmptyTableDataView;
