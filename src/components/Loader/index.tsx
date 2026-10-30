import { Bullseye, Grid, Spinner } from '@patternfly/react-core';
import { createUseStyles } from 'react-jss';

const useStyles = (minHeight?: string | number) =>
  createUseStyles({
    loader: {
      height: '100%',
      minHeight: minHeight,
    },
  });

export default function Loader({ minHeight = '40vh' }: { minHeight?: string | number }) {
  const classes = useStyles(minHeight)();
  return (
    <Grid className={classes.loader}>
      <Bullseye>
        <Spinner size='xl' />
      </Bullseye>
    </Grid>
  );
}
