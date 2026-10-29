import {
  EmptyStateBody,
  EmptyState,
  EmptyStateVariant,
  Button,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { SearchIcon, PlusCircleIcon } from '@patternfly/react-icons/dist/js/icons';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  emptyStateContainer: {
    display: 'flex',
    flexGrow: 1,
  },
  emptyStateBody: {
    marginBottom: '16px',
    textWrap: 'wrap',
    maxWidth: '500px',
  },
});

interface Props {
  notFiltered?: boolean;
  clearFilters: () => void;
  itemName: string;
  notFilteredBody?: string;
  notFilteredButton?: React.ReactNode;
}

const EmptyTableState = ({
  notFiltered,
  clearFilters,
  itemName,
  notFilteredBody,
  notFilteredButton,
}: Props) => {
  const classes = useStyles();
  return (
    <EmptyState
      headingLevel='h2'
      icon={notFiltered ? PlusCircleIcon : SearchIcon}
      titleText={<>{notFiltered ? `No ${itemName}` : `No ${itemName} match the filter criteria`}</>}
      variant={EmptyStateVariant.full}
      className={classes.emptyStateContainer}
    >
      <EmptyStateBody className={classes.emptyStateBody}>
        {notFiltered ? notFilteredBody : 'Clear all filters to show more results.'}
      </EmptyStateBody>
      <EmptyStateFooter>
        {notFiltered ? (
          notFilteredButton
        ) : (
          <Button ouiaId='clear_filters' variant='link' onClick={clearFilters}>
            Clear all filters
          </Button>
        )}
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default EmptyTableState;
