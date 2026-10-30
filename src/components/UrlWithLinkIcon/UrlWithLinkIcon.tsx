import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  link: {
    alignItems: 'center',
    display: 'flex',
    width: 'fit-content', // Prevents overflow of clickable area beyond visible content
  },
  icon: {
    marginLeft: '5px',
  },
});

interface Props {
  href: string;
  customText?: string;
}

const UrlWithExternalIcon = ({ href, customText }: Props) => {
  const classes = useStyles();
  return (
    <a href={href} className={classes.link} rel='noreferrer' target='_blank'>
      {customText ? customText : href} <ExternalLinkAltIcon className={classes.icon} />
    </a>
  );
};

export default UrlWithExternalIcon;
