/**
 * @file lib/notes-graph.ts
 *
 * Pure data shape for the notes popup. Given a project entry and the
 * full set of projectFiles, produces a typed FOLDER TREE that mirrors
 * the on-disk Obsidian structure under `src/content/projects/<slug>/`
 * at arbitrary depth — so the popup can render the real architecture
 * instead of a single flat list.
 *
 *   AdhkarCounter Index.md          → root note
 *   05 - Decisions/ADR-001.md       → folder "05 - Decisions" › note
 *   credits/manim_community.md      → folder "credits" › note
 *
 * Within each folder, notes sort by frontmatter.sort_order ascending
 * (then by relative path), and sub-folders sort alphabetically. A
 * level renders its own notes first, then its sub-folders — so a
 * project's numbered top-level narrative (00_index, 01_…) leads and
 * categorized folders (decisions/, credits/) follow.
 *
 * `order` is the depth-first flattening of that same arrangement: it
 * is the linear reading order the popup's prev/next stepper walks.
 *
 * Spec: [[decisions/ADR-020-notes-popup-folder-tree]].
 */

import type { CollectionEntry } from 'astro:content';

export interface NoteEntry {
  /** Full content id, e.g. `manim-wallpapers/credits/manim_community`. */
  fileId: string;
  /** Last path segment without extension, e.g. `manim_community`. */
  leaf: string;
  /** Display title — frontmatter.title falls back to the leaf. */
  title: string;
  /** Folder segments from the project root down to (not incl.) the leaf. */
  path: string[];
  /** Composed sort key — deterministic order within a folder. */
  sortKey: string;
  /** Original collection entry — caller renders via `render(file)`. */
  file: CollectionEntry<'projectFiles'>;
}

export interface FolderNode {
  /** Folder name (last path segment); `''` for the synthetic root. */
  name: string;
  /** Full folder path from the project root, e.g. `["05 - Decisions"]`. */
  path: string[];
  /** Child folders, sorted alphabetically. */
  folders: FolderNode[];
  /** Notes directly inside this folder, sorted by sortKey. */
  notes: NoteEntry[];
}

export interface NotesTree {
  slug: string;
  /** Total note count across the whole tree. */
  totalCount: number;
  /** Synthetic root folder (`name: ''`). Its notes/folders are top-level. */
  root: FolderNode;
  /** Depth-first reading order: each level's notes, then its sub-folders. */
  order: NoteEntry[];
}

function slugFor(projectId: string): string {
  return projectId.endsWith('/_index') ? projectId.slice(0, -'/_index'.length) : projectId;
}

function pad(n: number): string {
  // Offset keeps negatives (e.g. a folder-overview's sort_order: -1)
  // positive so a plain zero-padded string sorts in numeric order.
  return String(n + 100000).padStart(6, '0');
}

function emptyFolder(name: string, path: string[]): FolderNode {
  return { name, path, folders: [], notes: [] };
}

/** Find or create the descendant folder at `path` under `root`. */
function folderAt(root: FolderNode, path: string[]): FolderNode {
  let node = root;
  for (let i = 0; i < path.length; i++) {
    const name = path[i]!;
    let next = node.folders.find((f) => f.name === name);
    if (!next) {
      next = emptyFolder(name, path.slice(0, i + 1));
      node.folders.push(next);
    }
    node = next;
  }
  return node;
}

function sortFolder(node: FolderNode): void {
  node.notes.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  node.folders.sort((a, b) => a.name.localeCompare(b.name));
  for (const child of node.folders) sortFolder(child);
}

function flatten(node: FolderNode, out: NoteEntry[]): void {
  for (const note of node.notes) out.push(note);
  for (const child of node.folders) flatten(child, out);
}

/** Total notes in a folder and all its descendants. */
export function countNotes(node: FolderNode): number {
  let n = node.notes.length;
  for (const child of node.folders) n += countNotes(child);
  return n;
}

export function buildNotesTree(
  project: CollectionEntry<'projects'>,
  allFiles: readonly CollectionEntry<'projectFiles'>[],
): NotesTree {
  const slug = slugFor(project.id);
  const myFiles = allFiles.filter((f) => f.id.startsWith(`${slug}/`));

  const root = emptyFolder('', []);

  for (const f of myFiles) {
    const rel = f.id.slice(slug.length + 1); // strip "<slug>/"
    const segs = rel.split('/');
    const leaf = segs[segs.length - 1]!;
    const path = segs.slice(0, -1);
    folderAt(root, path).notes.push({
      fileId: f.id,
      leaf,
      title: f.data.title ?? leaf,
      path,
      sortKey: `${pad(f.data.sort_order ?? 0)}:${rel}`,
      file: f,
    });
  }

  sortFolder(root);
  const order: NoteEntry[] = [];
  flatten(root, order);

  return { slug, totalCount: myFiles.length, root, order };
}
