/**
 * @file lib/notes-popup-controller.ts
 *
 * Client-side controller for ProjectNotesPopup. One controller per
 * popup instance on the page. Responsibilities:
 *   - open / close in response to hash + button triggers
 *   - fold the folder tree (expand / collapse) and select notes
 *   - swap which note body is visible; keep the breadcrumb in sync
 *   - keep the URL hash in sync (#notes/<slug>/<...path>/<leaf>)
 *   - keyboard navigation: Esc closes, ← → step through notes in the
 *     depth-first reading order
 *   - focus management: trap focus while open, restore on close
 *   - lock body scroll while open
 *
 * Hash shapes we recognize (path segments are %-decoded so they match
 * the literal note ids, which contain spaces):
 *   #notes/<slug>                          → open first note
 *   #notes/<slug>/<...path>/<leaf>         → open that specific note
 *
 * Spec: [[decisions/ADR-020-notes-popup-folder-tree]].
 */

interface NoteRef {
  slug: string;
  fileId: string;
  title: string;
  /** folder segments from the project root (excludes the leaf). */
  path: string[];
  leaf: string;
}

interface PopupInstance {
  root: HTMLElement;
  slug: string;
  /** Depth-first reading order — drives prev/next + slug-only open. */
  order: NoteRef[];
  byId: Map<string, NoteRef>;
  /** Note body articles, keyed by fileId. */
  noteEls: Map<string, HTMLElement>;
  /** Sidebar tree note buttons, keyed by fileId. */
  treeNoteBtns: Map<string, HTMLElement>;
  /** Sidebar folder <li>s, keyed by their data-folder-path. */
  folderEls: Map<string, HTMLElement>;
  breadcrumb: HTMLElement | null;
  scrollEl: HTMLElement | null;
  /** The element that opened the popup; focus returns there on close. */
  trigger: HTMLElement | null;
}

const BODY_SCROLL_LOCK_CLASS = 'notes-popup-open';

function ensureScrollLockStyle(): void {
  if (document.getElementById('notes-popup-scroll-lock')) return;
  const tag = document.createElement('style');
  tag.id = 'notes-popup-scroll-lock';
  tag.textContent = `body.${BODY_SCROLL_LOCK_CLASS} { overflow: hidden; }`;
  document.head.appendChild(tag);
}

function focusableInside(root: HTMLElement): HTMLElement[] {
  const sel =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]),' +
    ' textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
    (el) => !el.hasAttribute('hidden') && el.offsetParent !== null,
  );
}

function parseHash(): { slug: string; fileId: string | null } | null {
  const raw = window.location.hash.slice(1);
  if (!raw.startsWith('notes/')) return null;
  const parts = raw
    .slice('notes/'.length)
    .split('/')
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  const slug = parts[0];
  if (!slug) return null;
  const rest = parts.slice(1);
  if (rest.length === 0) return { slug, fileId: null };
  return { slug, fileId: `${slug}/${rest.join('/')}` };
}

function writeHash(slug: string, ref: NoteRef | null): void {
  let value = `notes/${slug}`;
  if (ref) value = `notes/${slug}/${[...ref.path, ref.leaf].join('/')}`;
  const url = new URL(window.location.href);
  url.hash = value; // the URL serializer %-encodes spaces etc.
  window.history.replaceState({}, '', url.toString());
}

function clearHash(): void {
  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState({}, '', url.pathname + url.search);
}

function setFolderExpanded(li: HTMLElement, expanded: boolean): void {
  li.dataset.expanded = expanded ? 'true' : 'false';
  const toggle = li.querySelector<HTMLElement>(':scope > .notes-tree-folder-toggle');
  toggle?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  const caret = toggle?.querySelector<HTMLElement>('.notes-tree-caret');
  if (caret) caret.textContent = expanded ? '▾' : '▸';
}

function expandAncestors(inst: PopupInstance, ref: NoteRef): void {
  const acc: string[] = [];
  for (const seg of ref.path) {
    acc.push(seg);
    const li = inst.folderEls.get(acc.join('/'));
    if (li) setFolderExpanded(li, true);
  }
}

function renderBreadcrumb(el: HTMLElement, ref: NoteRef): void {
  el.textContent = '';
  for (const seg of ref.path) {
    const s = document.createElement('span');
    s.className = 'notes-popup-crumb-seg';
    s.textContent = seg;
    el.appendChild(s);
    const sep = document.createElement('span');
    sep.className = 'notes-popup-crumb-sep';
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = '›';
    el.appendChild(sep);
  }
  const title = document.createElement('span');
  title.className = 'notes-popup-crumb-title';
  title.textContent = ref.title;
  el.appendChild(title);
}

function updateStepper(inst: PopupInstance, ref: NoteRef): void {
  const i = inst.order.findIndex((n) => n.fileId === ref.fileId);
  const total = inst.order.length;
  const prevRef = i > 0 ? inst.order[i - 1] : undefined;
  const nextRef = i >= 0 && i < total - 1 ? inst.order[i + 1] : undefined;

  const prev = inst.root.querySelector<HTMLElement>('[data-step="prev"]');
  const next = inst.root.querySelector<HTMLElement>('[data-step="next"]');
  const prevLabel = inst.root.querySelector<HTMLElement>('[data-step-prev-label]');
  const nextLabel = inst.root.querySelector<HTMLElement>('[data-step-next-label]');
  const posEl = inst.root.querySelector<HTMLElement>('[data-step-pos]');

  if (prev) prev.setAttribute('aria-disabled', prevRef ? 'false' : 'true');
  if (next) next.setAttribute('aria-disabled', nextRef ? 'false' : 'true');
  if (prevLabel) prevLabel.textContent = prevRef ? prevRef.title : '—';
  if (nextLabel) nextLabel.textContent = nextRef ? nextRef.title : '—';
  if (posEl) posEl.textContent = `${i + 1} of ${total}`;
}

function setActiveNote(inst: PopupInstance, ref: NoteRef): void {
  inst.root.dataset.activeNote = ref.fileId;

  for (const [id, el] of inst.noteEls) {
    if (id === ref.fileId) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  }

  for (const [id, btn] of inst.treeNoteBtns) {
    const on = id === ref.fileId;
    btn.classList.toggle('is-active', on);
    if (on) btn.setAttribute('aria-current', 'true');
    else btn.removeAttribute('aria-current');
  }

  expandAncestors(inst, ref);
  inst.treeNoteBtns.get(ref.fileId)?.scrollIntoView({ block: 'nearest' });
  inst.scrollEl?.scrollTo({ top: 0 });

  if (inst.breadcrumb) renderBreadcrumb(inst.breadcrumb, ref);
  updateStepper(inst, ref);
}

function open(inst: PopupInstance, ref: NoteRef | null): void {
  if (inst.root.dataset.open === 'true') {
    if (ref) {
      setActiveNote(inst, ref);
      writeHash(inst.slug, ref);
    }
    return;
  }
  const target = ref ?? inst.order[0] ?? null;
  if (!target) return;

  if (!inst.trigger) {
    inst.trigger = (document.activeElement as HTMLElement | null) ?? null;
  }

  // 1) unhide so the element enters layout at its initial CSS state
  inst.root.removeAttribute('hidden');
  inst.root.setAttribute('aria-hidden', 'false');
  // 2) force a synchronous reflow so the transition has a "before" state
  void inst.root.offsetWidth;
  // 3) flip the state attribute — triggers the transition
  inst.root.dataset.open = 'true';
  document.body.classList.add(BODY_SCROLL_LOCK_CLASS);

  setActiveNote(inst, target);
  writeHash(inst.slug, target);

  const closeBtn = inst.root.querySelector<HTMLElement>('[data-notes-close]');
  closeBtn?.focus();
}

function close(inst: PopupInstance, clearTheHash: boolean = true): void {
  if (inst.root.dataset.open !== 'true') return;
  inst.root.dataset.open = 'false';
  inst.root.setAttribute('aria-hidden', 'true');
  document.body.classList.remove(BODY_SCROLL_LOCK_CLASS);
  window.setTimeout(() => {
    if (inst.root.dataset.open !== 'true') inst.root.setAttribute('hidden', '');
  }, 220);
  if (clearTheHash) clearHash();
  const toFocus = inst.trigger;
  inst.trigger = null;
  toFocus?.focus();
}

function trapFocus(inst: PopupInstance, e: KeyboardEvent): void {
  if (e.key !== 'Tab') return;
  const focusables = focusableInside(inst.root);
  if (focusables.length === 0) return;
  const first = focusables[0]!;
  const last = focusables[focusables.length - 1]!;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function stepBy(inst: PopupInstance, dir: -1 | 1): void {
  const activeId = inst.root.dataset.activeNote ?? '';
  const i = inst.order.findIndex((n) => n.fileId === activeId);
  const target = inst.order[i + dir];
  if (!target) return;
  setActiveNote(inst, target);
  writeHash(inst.slug, target);
}

function buildInstance(root: HTMLElement): PopupInstance | null {
  const slug = root.dataset.projectSlug;
  if (!slug) return null;

  const order: NoteRef[] = [];
  const byId = new Map<string, NoteRef>();
  const noteEls = new Map<string, HTMLElement>();

  for (const el of root.querySelectorAll<HTMLElement>('.notes-popup-note')) {
    const fileId = el.dataset.noteId;
    if (!fileId) continue;
    const title = el.dataset.noteTitle ?? fileId.split('/').pop() ?? fileId;
    const pathStr = el.dataset.notePath ?? '';
    const path = pathStr ? pathStr.split('/') : [];
    const leaf = fileId.split('/').pop()!;
    const ref: NoteRef = { slug, fileId, title, path, leaf };
    order.push(ref);
    byId.set(fileId, ref);
    noteEls.set(fileId, el);
  }

  const treeNoteBtns = new Map<string, HTMLElement>();
  for (const btn of root.querySelectorAll<HTMLElement>('[data-tree-note]')) {
    const id = btn.dataset.treeNote;
    if (id) treeNoteBtns.set(id, btn);
  }

  const folderEls = new Map<string, HTMLElement>();
  for (const li of root.querySelectorAll<HTMLElement>('.notes-tree-folder')) {
    const p = li.dataset.folderPath;
    if (p) folderEls.set(p, li);
  }

  return {
    root,
    slug,
    order,
    byId,
    noteEls,
    treeNoteBtns,
    folderEls,
    breadcrumb: root.querySelector<HTMLElement>('[data-note-breadcrumb]'),
    scrollEl: root.querySelector<HTMLElement>('[data-notes-scroll]'),
    trigger: null,
  };
}

function wire(inst: PopupInstance): void {
  // tree note selection
  for (const [fileId, btn] of inst.treeNoteBtns) {
    btn.addEventListener('click', () => {
      const ref = inst.byId.get(fileId);
      if (!ref) return;
      setActiveNote(inst, ref);
      writeHash(inst.slug, ref);
    });
  }

  // folder expand / collapse
  for (const li of inst.folderEls.values()) {
    const toggle = li.querySelector<HTMLElement>(':scope > .notes-tree-folder-toggle');
    toggle?.addEventListener('click', () => {
      setFolderExpanded(li, li.dataset.expanded === 'false');
    });
  }

  // stepper (prev / next in reading order)
  inst.root.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-disabled') === 'true') return;
      stepBy(inst, btn.dataset.step === 'prev' ? -1 : 1);
    });
  });

  // close affordances
  inst.root.querySelector<HTMLElement>('[data-notes-close]')?.addEventListener('click', () =>
    close(inst),
  );
  inst.root.querySelector<HTMLElement>('[data-notes-backdrop]')?.addEventListener('click', () =>
    close(inst),
  );

  // keyboard
  inst.root.addEventListener('keydown', (e) => {
    if (inst.root.dataset.open !== 'true') return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close(inst);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepBy(inst, 1);
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepBy(inst, -1);
      return;
    }
    trapFocus(inst, e);
  });
}

/**
 * Boot every popup on the page. Called once on DOM ready.
 */
export function initNotesPopups(): void {
  ensureScrollLockStyle();

  const popups = Array.from(document.querySelectorAll<HTMLElement>('[data-notes-popup]'));
  const instances = new Map<string, PopupInstance>();

  for (const root of popups) {
    const inst = buildInstance(root);
    if (!inst) continue;
    wire(inst);
    instances.set(inst.slug, inst);
  }

  function syncFromHash(): void {
    const parsed = parseHash();
    if (!parsed) {
      for (const inst of instances.values()) {
        if (inst.root.dataset.open === 'true') close(inst, false);
      }
      return;
    }
    const inst = instances.get(parsed.slug);
    if (!inst) return;
    for (const other of instances.values()) {
      if (other !== inst && other.root.dataset.open === 'true') close(other, false);
    }
    const exact = parsed.fileId ? inst.byId.get(parsed.fileId) : null;
    open(inst, exact ?? null);
  }

  // trigger buttons (the "open notes" link in each chapter). Record the
  // trigger element for focus-restore before the hash change happens.
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-notes-trigger]');
    if (!target) return;
    const slug = target.dataset.notesTrigger;
    if (!slug) return;
    const inst = instances.get(slug);
    if (!inst) return;
    inst.trigger = target;
  });

  window.addEventListener('hashchange', syncFromHash);
  syncFromHash();
}
