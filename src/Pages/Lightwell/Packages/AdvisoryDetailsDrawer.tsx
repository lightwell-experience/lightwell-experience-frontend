import {
  Backdrop,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  Tab,
  Tabs,
  TabTitleText,
} from '@patternfly/react-core';
import drawerStyles from '@patternfly/react-styles/css/components/Drawer/drawer';
import { useLayoutEffect, useState, PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import { createUseStyles } from 'react-jss';

import LightwellEmptyState from '../components/LightwellEmptyState';
import type { AdvisoryDetails, PreferredAdvisoryRecord } from './types';
import { useAdvisoryDetails } from './hooks/useAdvisoryDetails';

import { useDrawerOverlay } from './hooks/useDrawerOverlay';
import AdvisoryDetailsSkeleton from './components/AdvisoryDetailsSkeleton';
import AdvisoryDetailsPanel from './components/AdvisoryDetailsPanel';
import AdvisoryOSVTab from './tabs/AdvisoryOSVTab';
import AdvisoryOverviewTab from './tabs/AdvisoryOverviewTab';
import AdvisoryRemediationsTab from './tabs/AdvisoryRemediationsTab';
import { useAdvisoryDrawerParams } from './hooks/useAdvisoryDrawerParams';

const AdvisoryDetailTab = {
  OVERVIEW: 'overview',
  REMEDIATIONS: 'remediations',
  OSV: 'osv',
} as const;

type AdvisoryDetailTab = (typeof AdvisoryDetailTab)[keyof typeof AdvisoryDetailTab];

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

type AdvisoryDetailsDrawerProps = PropsWithChildren<{
  preferredRecord: PreferredAdvisoryRecord;
}>;

const getTabContent = (details: AdvisoryDetails | undefined, isDetailsUnavailable: boolean) => {
  if (isDetailsUnavailable) {
    return {
      overview: (
        <LightwellEmptyState
          variant='empty'
          titleText='No vulnerability details found'
          bodyText='No details are available for this vulnerability.'
        />
      ),
      remediations: null,
      osv: null,
    };
  }

  if (!details) {
    return null;
  }

  return {
    overview: (
      <AdvisoryOverviewTab advisoryName={details.advisoryName} overview={details.overview} />
    ),
    remediations: (
      <AdvisoryRemediationsTab
        advisoryName={details.advisoryName}
        remediations={details.remediations}
      />
    ),
    osv: <AdvisoryOSVTab advisoryName={details.advisoryName} osv={details.osv} />,
  };
};

const AdvisoryDetailsDrawer = ({ children, preferredRecord }: AdvisoryDetailsDrawerProps) => {
  const classes = useStyles();

  const { advisoryName, isDrawerExpanded, closeDrawer } = useAdvisoryDrawerParams();

  const {
    data: details,
    isLoading,
    isError,
    isSuccess,
  } = useAdvisoryDetails(advisoryName, {
    enabled: isDrawerExpanded && Boolean(advisoryName),
    // A CVE can span ecosystems, so prefer the record for the package and version being viewed
    preferredRecord,
  });

  const { isOverlayMounted, isOverlayExpanded, onOverlayTransitionEnd, onEscape } =
    useDrawerOverlay({ isExpanded: isDrawerExpanded, onClose: closeDrawer });

  // A refetch can set isError while cached details remain, so show unavailable only when details is absent
  const isDetailsUnavailable = !details && (isError || (isSuccess && isDrawerExpanded));

  const [activeTabKey, setActiveTabKey] = useState<AdvisoryDetailTab>(AdvisoryDetailTab.OVERVIEW);

  useLayoutEffect(() => {
    setActiveTabKey(AdvisoryDetailTab.OVERVIEW);
  }, [
    advisoryName,
    isDetailsUnavailable,
    preferredRecord.repository,
    preferredRecord.packageName,
    preferredRecord.packageVersion,
  ]);

  // Remount the tabs when the advisory context changes to reset state inside each tab
  const detailKey = JSON.stringify([
    advisoryName,
    preferredRecord.repository,
    preferredRecord.packageName,
    preferredRecord.packageVersion,
  ]);

  const tabContent = getTabContent(details, isDetailsUnavailable);

  const panelContent = (
    <AdvisoryDetailsPanel
      advisoryName={advisoryName}
      details={details}
      isDetailsUnavailable={isDetailsUnavailable}
      onClose={closeDrawer}
    >
      {isLoading || tabContent ? (
        <Tabs
          key={detailKey}
          activeKey={isLoading || isDetailsUnavailable ? AdvisoryDetailTab.OVERVIEW : activeTabKey}
          onSelect={(_, eventKey) => setActiveTabKey(eventKey as AdvisoryDetailTab)}
          aria-label='Vulnerability details tabs'
          ouiaId='lightwell-vulnerability-details-tabs'
        >
          <Tab
            eventKey={AdvisoryDetailTab.OVERVIEW}
            title={<TabTitleText>Overview</TabTitleText>}
            aria-label='Vulnerability overview tab'
            ouiaId='lightwell-vulnerability-overview-tab'
          >
            {isLoading ? (
              <AdvisoryDetailsSkeleton advisoryName={advisoryName} />
            ) : (
              tabContent?.overview
            )}
          </Tab>
          <Tab
            eventKey={AdvisoryDetailTab.REMEDIATIONS}
            title={<TabTitleText>Remediations</TabTitleText>}
            aria-label='Vulnerability remediations tab'
            ouiaId='lightwell-vulnerability-remediations-tab'
            isDisabled={isLoading || isDetailsUnavailable}
          >
            {tabContent?.remediations}
          </Tab>
          <Tab
            eventKey={AdvisoryDetailTab.OSV}
            title={<TabTitleText>OSV</TabTitleText>}
            aria-label='Vulnerability OSV tab'
            ouiaId='lightwell-vulnerability-osv-tab'
            isDisabled={isLoading || isDetailsUnavailable}
          >
            {tabContent?.osv}
          </Tab>
        </Tabs>
      ) : null}
    </AdvisoryDetailsPanel>
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

export default AdvisoryDetailsDrawer;
