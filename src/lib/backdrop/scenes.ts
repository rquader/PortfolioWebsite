/**
 * @file scenes.ts
 *
 * Scene registry — V1 ships the recursive tree only. Additional scenes
 * (network-nodes, drift-field, aurora) can register here and be mounted
 * by id without touching component code.
 *
 * Spec: [[Concept - Recursive Tree Backdrop#scene engine (forward-looking, not V1)]].
 */

import { mountTree, type TreeOptions } from './tree';

export type SceneId =
  | 'tree'
  | 'network-nodes'    // ports network_nodes.py     — not ported in V1
  | 'drift-field'      // ports drift_field.py       — not ported in V1
  | 'aurora-subtle'    // ports aurora_subtle.py     — not ported in V1
  | 'aurora'           // ports aurora.py            — not ported in V1
  | 'constellation'    // ports constellation.py     — not ported in V1
  | 'falling-leaves';  // ports falling_leaves.py    — not ported in V1

export interface SceneHandle {
  stop(): void;
}

type AnyMountFn = (canvas: HTMLCanvasElement, opts: unknown) => SceneHandle;

const registry: Partial<Record<SceneId, AnyMountFn>> = {
  tree: ((canvas, opts) => mountTree(canvas, opts as TreeOptions)) as AnyMountFn,
};

export function mountScene(id: SceneId, canvas: HTMLCanvasElement, opts: unknown = {}): SceneHandle {
  const fn = registry[id];
  if (!fn) {
    throw new Error(
      `mountScene: scene "${id}" is not registered. V1 ships only "tree" — ` +
        `see Concept - Recursive Tree Backdrop#scene engine.`,
    );
  }
  return fn(canvas, opts);
}
