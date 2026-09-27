import type { DialogueNode, DialogueTree } from '../../types';
import bridge from './bridge.json';
import common from './common.json';
import cryo from './cryo.json';
import engine from './engine.json';
import habitat from './habitat.json';
import hydro from './hydro.json';
import security from './security.json';

type RawTrees = Record<string, { start: string; nodes: Record<string, DialogueNode> }>;

const SOURCES = [common, cryo, hydro, engine, habitat, security, bridge] as unknown as RawTrees[];

function build(): Record<string, DialogueTree> {
  const out: Record<string, DialogueTree> = {};
  for (const src of SOURCES) {
    for (const [id, raw] of Object.entries(src)) {
      if (out[id]) throw new Error(`Duplicate dialogue id: ${id}`);
      out[id] = { id, start: raw.start, nodes: raw.nodes };
    }
  }
  return out;
}

export const DIALOGUES: Record<string, DialogueTree> = build();
