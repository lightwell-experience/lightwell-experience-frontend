import '@patternfly/react-catalog-view-extension/dist/css/react-catalog-view-extension.css';
import './kit/lightwell.config.css';
import './kit/components/components.config.css';
import './kit/components/assemblies/page/page.config.css';
import './kit/patternfly-base-overrides.css';
import '../styles/lightwell-chrome-overrides.scss';
import '../styles/lightwell-clipboard-copy.scss';
import '../styles/lightwell-coverage-charts.scss';
import { Alert } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Loader from 'components/Loader';

import { ErrorPage } from 'components/Error/ErrorPage';
import usePageSafe from 'Hooks/usePageSafe';
import PackagesTable from 'Pages/Lightwell/Packages/PackagesTable';
import PackageDetails from 'Pages/Lightwell/Packages/PackageDetails';
import RepositoriesTable from 'Pages/Lightwell/Repositories/RepositoriesTable';
import Beacon from 'Pages/Lightwell/Beacon/Beacon';
import LightwellNotFound from 'Pages/Lightwell/components/LightwellNotFound';
import { LightwellDemoLayout } from 'Pages/Lightwell/LightwellDemoContext';
import LightwellLayout from 'Pages/Lightwell/LightwellLayout';
import { lightwellConfig } from 'kit/lightwell.config';
import { useAppContext } from './middleware/AppContext';
import CoverageReport from 'Pages/Lightwell/Lens/CoverageReport';
import ManifestUpload from 'Pages/Lightwell/Lens/ManifestUpload';
import TermsGuard from 'Pages/Lightwell/components/TermsGuard';

export default function LightwellApp() {
  const pageSafe = usePageSafe();
  const { hideGlobalFilter } = useChrome();
  const { features, isFetchingPermissions } = useAppContext();

  useEffect(() => {
    hideGlobalFilter(true);
  }, [hideGlobalFilter]);

  // Kit CSS is webpack-scoped to `html.${htmlThemeClass}`. Chrome may also set this
  // for /lightwell*; ensure it while Lightwell is mounted so LwPageHeader / kit units paint.
  useEffect(() => {
    const { classList } = document.documentElement;
    const themeClass = lightwellConfig.htmlThemeClass;
    classList.add(themeClass);
    return () => {
      classList.remove(themeClass);
    };
  }, []);

  // PF Page `isPlain` → `pf-m-plain`. Stage chrome may set this via Page props; local
  // insights-chrome-dev images and pre-promote prod often do not. Ensure the modifier
  // on Chrome's Lightwell page shell so overrides + PF plain tokens apply. Only remove
  // what we added. Watch the page node's class only — subtree on chrome root fights
  // React className reconciliation and can blink the shell.
  useEffect(() => {
    const { chromePageClass, pagePlainClass } = lightwellConfig;
    const ensured = new WeakSet<Element>();
    let applying = false;
    let pageObserver: MutationObserver | null = null;
    let watchedPage: HTMLElement | null = null;

    const ensurePagePlain = (): HTMLElement | null => {
      const page = document.querySelector<HTMLElement>(`.pf-v6-c-page.${chromePageClass}`);
      if (!page) return null;
      if (!page.classList.contains(pagePlainClass)) {
        applying = true;
        page.classList.add(pagePlainClass);
        ensured.add(page);
        applying = false;
      }
      return page;
    };

    const watchPage = (page: HTMLElement) => {
      if (watchedPage === page) return;
      pageObserver?.disconnect();
      watchedPage = page;
      pageObserver = new MutationObserver(() => {
        if (applying) return;
        ensurePagePlain();
      });
      pageObserver.observe(page, {
        attributes: true,
        attributeFilter: ['class'],
      });
    };

    const page = ensurePagePlain();
    if (page) {
      watchPage(page);
    }

    const mountRoot =
      document.querySelector('#chrome-app-render-root') ??
      document.querySelector('.pf-v6-c-page')?.parentElement ??
      document.body;
    const mountObserver = new MutationObserver(() => {
      const mounted = ensurePagePlain();
      if (mounted) {
        watchPage(mounted);
        mountObserver.disconnect();
      }
    });
    if (!page) {
      mountObserver.observe(mountRoot, { childList: true, subtree: true });
    }

    return () => {
      pageObserver?.disconnect();
      mountObserver.disconnect();
      if (watchedPage && ensured.has(watchedPage)) {
        watchedPage.classList.remove(pagePlainClass);
      }
    };
  }, []);

  // OUIA readiness on <html> — avoid an empty flex sibling under page__main.
  useEffect(() => {
    const { dataset } = document.documentElement;
    dataset.ouiaSafe = String(pageSafe);
    return () => {
      delete dataset.ouiaSafe;
    };
  }, [pageSafe]);

  const termsEnabled =
    !!features?.lightwellterms?.enabled && !!features?.lightwellterms?.accessible;

  const routes = (
    <Routes>
      {/* Demo routes keep their own layout — no live subnav */}
      <Route path='demo' element={<LightwellDemoLayout />}>
        <Route index element={<RepositoriesTable />} />
        <Route path=':repoName/:group/:packageName' element={<PackageDetails />} />
        <Route path=':repoName/:packageName' element={<PackageDetails />} />
        <Route path=':repoName' element={<PackagesTable />} />
      </Route>
      {/* Live routes share LightwellLayout which renders the subnav inside pf-v6-c-page__main */}
      <Route element={<LightwellLayout />}>
        <Route index element={<RepositoriesTable />} />
        {features?.lightwellbeacon?.enabled && features?.lightwellbeacon?.accessible ? (
          <Route path='beacon' element={<Beacon />} />
        ) : null}
        {features?.lightwelllens?.enabled && features?.lightwelllens?.accessible ? (
          <>
            <Route path='lens' element={<ManifestUpload />} />
            <Route path='lens/:reportUUID' element={<CoverageReport />} />
          </>
        ) : null}
        <Route path=':repoName/:group/:packageName' element={<PackageDetails />} />
        <Route path=':repoName/:packageName' element={<PackageDetails />} />
        <Route path=':repoName' element={<PackagesTable />} />
        <Route path='*' element={<LightwellNotFound />} />
      </Route>
    </Routes>
  );

  return (
    <ErrorPage>
      <Alert
        variant='info'
        isInline
        className={`${spacing.mxLg} ${spacing.mtLg}`}
        title='This is the new Lightwell app, served from the lightwell-experience-frontend repository.'
      />
      {isFetchingPermissions ? (
        <Loader />
      ) : termsEnabled ? (
        <TermsGuard>{routes}</TermsGuard>
      ) : (
        routes
      )}
    </ErrorPage>
  );
}
