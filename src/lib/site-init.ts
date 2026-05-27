/**
 * @file site-init.ts
 *
 * Single client-side entry point: starts the rAF boot loop and
 * initializes each primitive against whatever's present in the DOM.
 */

import { startBoot } from './boot';
import { mountFallingLeaves } from './backdrop/falling-leaves';
import { initCursorCompanion } from './primitives/cursor-companion';
import { initInertialType } from './primitives/inertial-type';
import { initSynesthesia } from './primitives/synesthesia';
import { initPhosphor } from './primitives/phosphor';
import { initScrollSpy } from './scroll-spy';
import { initObsidianBolds } from './markdown/obsidian-bolds';
import { initThemeToggle } from './theme-toggle';
import { initPhotoLightbox } from './primitives/photo-lightbox';
import { initProjectMediaCarousels } from './primitives/project-media-carousel';
import { initTreeHint } from './primitives/tree-hint';

export function initSite(): void {
  startBoot();

  initThemeToggle();

  const pageLeaves = document.getElementById('page-leaves');
  if (pageLeaves instanceof HTMLCanvasElement) {
    mountFallingLeaves(pageLeaves, { palette: 'sepia' });
  }

  initCursorCompanion();
  initPhosphor();

  initObsidianBolds();
  initInertialType(document.body);

  const onMe = document.querySelector<HTMLElement>('#on-me');
  if (onMe) initSynesthesia(onMe);

  initPhotoLightbox();
  initProjectMediaCarousels();
  initTreeHint();
  initScrollSpy();
}
