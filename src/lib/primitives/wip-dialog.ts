/**
 * @file wip-dialog.ts
 *
 * Opens a small centered dialog when a project WIP sticker is clicked.
 * One shared dialog on /projects; note text comes from data-wip-note.
 */

export function initWipDialog(): { stop: () => void } {
  if (typeof document === 'undefined') return { stop: () => {} };

  const dialog = document.getElementById('wip-dialog');
  const body = document.getElementById('wip-dialog-body');
  const closeBtn = dialog?.querySelector<HTMLButtonElement>('.wip-dialog-close');
  if (!dialog || !body) return { stop: () => {} };

  const onClose = (): void => {
    dialog.dataset.open = 'false';
    dialog.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const onOpen = (note: string): void => {
    body.textContent = note;
    dialog.removeAttribute('hidden');
    dialog.dataset.open = 'true';
    dialog.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  };

  const onStickerClick = (e: Event): void => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-wip-trigger]');
    if (!btn) return;
    e.preventDefault();
    const note = btn.getAttribute('data-wip-note') ?? '';
    if (note) onOpen(note);
  };

  const onBackdrop = (e: MouseEvent): void => {
    if (e.target === dialog || (e.target as HTMLElement).closest('.wip-dialog-close')) {
      onClose();
    }
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && dialog.dataset.open === 'true') onClose();
  };

  document.addEventListener('click', onStickerClick);
  dialog.addEventListener('click', onBackdrop);
  document.addEventListener('keydown', onKey);

  return {
    stop: () => {
      document.removeEventListener('click', onStickerClick);
      dialog.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
    },
  };
}
