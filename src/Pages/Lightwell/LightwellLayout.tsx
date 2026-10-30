import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Shared layout for all live Lightwell routes.
 *
 * Moves Chrome-injected `.chr-c-page-subnav` into the pf-v6-c-page__main flex
 * column so nav participates in the page flow. Also strips `.pf-m-subnav` once
 * the nav lives in-column (no longer PF subnav chrome). Chrome re-renders can
 * re-add the modifier; observe and strip while mounted.
 *
 * Footer and `#consent_blackbar` stay in Chrome's DOM homes — relocating them
 * fights React reconciliation on route changes.
 *
 * Active state for nav links is handled natively by the Chrome navigation service.
 */
const LightwellLayout = () => {
  useEffect(() => {
    const pageMain = document.querySelector<HTMLElement>('.pf-v6-c-page__main');
    if (!pageMain) return;

    // Nav: move from pf-v6-c-page grid root → page main flex column.
    // CSS keeps it hidden while it's a direct child of the grid root (flash prevention).
    const subnav = document.querySelector<HTMLElement>('.chr-c-page-subnav');
    const subnavOrigin = subnav?.parentElement ?? null;
    if (subnav && subnavOrigin !== pageMain) {
      pageMain.prepend(subnav);
    }

    let stripping = false;
    const stripSubnavModifier = () => {
      if (!subnav || stripping) return;
      const targets = subnav.querySelectorAll<HTMLElement>('.pf-v6-c-nav.pf-m-subnav');
      if (targets.length === 0) return;
      stripping = true;
      targets.forEach((el) => {
        el.classList.remove('pf-m-subnav');
      });
      stripping = false;
    };
    stripSubnavModifier();

    // Observe nav nodes only — avoid childList/subtree feedback with Chrome React.
    const navObserver = subnav ? new MutationObserver(() => stripSubnavModifier()) : null;
    if (navObserver && subnav) {
      const observeNav = (el: HTMLElement) => {
        navObserver.observe(el, {
          attributes: true,
          attributeFilter: ['class'],
        });
      };
      subnav.querySelectorAll<HTMLElement>('.pf-v6-c-nav').forEach(observeNav);
      // Nav host may receive the modifier before the inner .pf-v6-c-nav exists.
      observeNav(subnav);
    }

    return () => {
      navObserver?.disconnect();
      subnav?.querySelectorAll<HTMLElement>('.pf-v6-c-nav').forEach((el) => {
        el.classList.add('pf-m-subnav');
      });
      if (subnav && subnavOrigin && subnav.parentElement !== subnavOrigin) {
        subnavOrigin.append(subnav);
      }
    };
  }, []);

  return <Outlet />;
};

export default LightwellLayout;
