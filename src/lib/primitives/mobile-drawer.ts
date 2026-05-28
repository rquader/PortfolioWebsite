/**
 * @file mobile-drawer.ts
 *
 * Drawer controller for the mobile shell's top nav (MobileTopNav.astro).
 *
 *   - Open / close on [data-drawer-open] / [data-drawer-close] / scrim click.
 *   - Close on Esc, on link click (so tapping a section navigates AND
 *     dismisses the drawer in one gesture), and on viewport widening
 *     past the mobile breakpoint (so a phone rotated to landscape
 *     where the desktop shell is visible doesn't strand the drawer
 *     open).
 *   - Body scroll lock while open.
 *   - Theme buttons in the drawer foot wire to [data-theme-set] so
 *     the existing theme toggle key (`rq-theme`) stays the single
 *     source of truth.
 *
 * No-op when MobileTopNav isn't on the page (desktop pages, etc.).
 *
 * Spec: [[decisions/ADR-021-desktop-overhaul-and-dual-shell-mobile]]
 */

const BODY_LOCK_CLASS = 'mobile-drawer-open';
const MOBILE_BREAKPOINT_PX = 720;

export interface MobileDrawerHandle {
  stop(): void;
}

let active: MobileDrawerHandle | null = null;

export function initMobileDrawer(): MobileDrawerHandle {
  active?.stop();

  if (typeof document === 'undefined') {
    const noop = { stop: () => {} };
    active = noop;
    return noop;
  }

  const drawer = document.getElementById('mobile-drawer');
  const scrim = document.querySelector<HTMLElement>('[data-drawer-scrim]');
  const openBtn = document.querySelector<HTMLButtonElement>('[data-drawer-open]');
  const closeBtn = document.querySelector<HTMLButtonElement>('[data-drawer-close]');

  if (!drawer || !scrim || !openBtn || !closeBtn) {
    const noop = { stop: () => {} };
    active = noop;
    return noop;
  }

  function open(): void {
    drawer!.removeAttribute('hidden');
    // Two-frame delay so the `transform: translateX(100%)` initial
    // state lands in layout before the `data-open=true` rule fires the
    // transition — otherwise Safari often skips the animation.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        drawer!.setAttribute('data-open', 'true');
        drawer!.setAttribute('aria-hidden', 'false');
        scrim!.setAttribute('data-open', 'true');
        openBtn!.setAttribute('aria-expanded', 'true');
        document.body.classList.add(BODY_LOCK_CLASS);
      });
    });
  }

  function close(): void {
    drawer!.setAttribute('data-open', 'false');
    drawer!.setAttribute('aria-hidden', 'true');
    scrim!.setAttribute('data-open', 'false');
    openBtn!.setAttribute('aria-expanded', 'false');
    document.body.classList.remove(BODY_LOCK_CLASS);
    // Hide after the transition so the panel doesn't trap focus while
    // off-screen. 320ms is just past the --d-med duration (260ms).
    setTimeout(() => {
      if (drawer!.getAttribute('data-open') === 'false') {
        drawer!.setAttribute('hidden', '');
      }
    }, 320);
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && drawer!.getAttribute('data-open') === 'true') {
      close();
    }
  }

  function onResize(): void {
    if (
      window.innerWidth > MOBILE_BREAKPOINT_PX &&
      drawer!.getAttribute('data-open') === 'true'
    ) {
      close();
    }
  }

  // Drawer link clicks: close the drawer so the section is visible
  // (hash navigation runs as normal).
  function onLinkClick(e: Event): void {
    const a =
      e.target instanceof Element ? e.target.closest('[data-drawer-link]') : null;
    if (a) close();
  }

  // Theme buttons in the drawer foot — write to localStorage AND set
  // the documentElement attribute, mirroring what initThemeToggle does
  // for the desktop button.
  function onThemeClick(e: Event): void {
    const btn =
      e.target instanceof Element
        ? e.target.closest<HTMLButtonElement>('[data-theme-set]')
        : null;
    if (!btn) return;
    const next = btn.dataset.themeSet === 'dark' ? 'dark' : 'light';
    try {
      localStorage.setItem('rq-theme', next);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute('data-theme', next);
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  drawer.addEventListener('click', onLinkClick);
  drawer.addEventListener('click', onThemeClick);

  const handle: MobileDrawerHandle = {
    stop(): void {
      openBtn.removeEventListener('click', open);
      closeBtn.removeEventListener('click', close);
      scrim.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      drawer.removeEventListener('click', onLinkClick);
      drawer.removeEventListener('click', onThemeClick);
      document.body.classList.remove(BODY_LOCK_CLASS);
    },
  };
  active = handle;
  return handle;
}
