import {
  Backdrop,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Title,
} from '@patternfly/react-core';
import drawerStyles from '@patternfly/react-styles/css/components/Drawer/drawer';
import type { PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import { createUseStyles } from 'react-jss';

import { useDrawerOverlay } from '../../hooks/useDrawerOverlay';

import SubmissionDetails from './SubmissionDetails';
import { useSubmissionDrawerParams } from '../hooks/useSubmissionDrawerParams';

const SUBMISSION_DRAWER_TITLE_ID = 'lightwell-submission-drawer-title';

const useStyles = createUseStyles({
  overlayDrawer: {
    position: 'absolute',
    inset: 0,
    height: '100%',
    pointerEvents: 'none',
    '& .pf-v6-c-drawer__panel': {
      pointerEvents: 'auto',
    },
  },
});

type SubmissionDrawerProps = PropsWithChildren;

/**
 * Overlay drawer for a single clearinghouse submission, mirroring the Packages
 * AdvisoryDetailsDrawer: a glass panel that slides over the content on top of a
 * portaled backdrop. Open state lives in the `?submission=<uuid>` URL param.
 * The head holds the static "Submission details" title; the panel body is
 * SubmissionDetails (which renders the filename, status, and downloads).
 * Destructive/terminal actions close the drawer (the table refetches via the
 * mutations themselves).
 */
const SubmissionDrawer = ({ children }: SubmissionDrawerProps) => {
  const classes = useStyles();
  const { openUuid, isDrawerExpanded, closeDrawer } = useSubmissionDrawerParams();

  const { isOverlayMounted, isOverlayExpanded, onOverlayTransitionEnd, onEscape } =
    useDrawerOverlay({
      isExpanded: isDrawerExpanded,
      onClose: closeDrawer,
    });

  const panelContent = (
    <DrawerPanelContent
      isResizable
      isGlass
      id='lightwell-submission-details-panel'
      minSize='462px'
      maxSize='1422px'
      widths={{ default: 'width_50' }}
      resizeAriaLabel='Resize submission details drawer'
      focusTrap={{
        enabled: true,
        elementToFocusOnExpand: `#${SUBMISSION_DRAWER_TITLE_ID}`,
        'aria-labelledby': SUBMISSION_DRAWER_TITLE_ID,
      }}
    >
      <DrawerHead>
        <Title id={SUBMISSION_DRAWER_TITLE_ID} tabIndex={-1} headingLevel='h2' size='lg'>
          Submission details
        </Title>
        <DrawerActions>
          <DrawerCloseButton onClose={closeDrawer} />
        </DrawerActions>
      </DrawerHead>
      {openUuid ? (
        <SubmissionDetails uuid={openUuid} onDeleted={closeDrawer} onSubmitted={closeDrawer} />
      ) : null}
    </DrawerPanelContent>
  );

  return (
    <Drawer isExpanded={isDrawerExpanded} onKeyDown={onEscape} isPill position='end'>
      <DrawerContent
        panelContent={
          isOverlayMounted
            ? createPortal(
                <Backdrop onClick={closeDrawer}>
                  <div
                    className={`${drawerStyles.drawer} ${isOverlayExpanded ? drawerStyles.modifiers.expanded : ''} ${drawerStyles.modifiers.pill} ${classes.overlayDrawer}`}
                    onClick={(event) => event.stopPropagation()}
                    onTransitionEnd={onOverlayTransitionEnd}
                  >
                    <div className={drawerStyles.drawerMain}>
                      <div className={drawerStyles.drawerContent} />
                      {panelContent}
                    </div>
                  </div>
                </Backdrop>,
                document.body,
              )
            : panelContent
        }
      >
        <DrawerContentBody>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default SubmissionDrawer;
