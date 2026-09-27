import { formatClock } from '../constants';
import { DIALOGUES } from '../data/dialogue';
import type { DialogueChoice, DialogueCtx, DialogueNode, DialogueTree, GameData } from '../types';
import { applyEffects, evalCondition, type GameEvent } from './rules';

export interface DialogueState {
  tree: DialogueTree;
  nodeId: string;
  ctx: DialogueCtx;
}

export interface DialogueStep {
  state: DialogueState | null;
  data: GameData;
  events: GameEvent[];
}

export function getTree(id: string): DialogueTree | undefined {
  return DIALOGUES[id];
}

function routeNext(node: DialogueNode, d: GameData, ctx: DialogueCtx): string | undefined {
  if (node.jump) {
    const j = node.jump.find((x) => evalCondition(x.if, d, ctx));
    if (j) return j.to;
  }
  return node.next;
}

function enterNode(tree: DialogueTree, startId: string, data: GameData, ctx: DialogueCtx): DialogueStep {
  let id: string | undefined = startId;
  let d = data;
  const events: GameEvent[] = [];
  for (let guard = 0; id && guard < 64; guard++) {
    const node: DialogueNode | undefined = tree.nodes[id];
    if (!node) break;
    if (node.effects?.length) {
      const r = applyEffects(d, node.effects, ctx);
      d = r.data;
      events.push(...r.events);
    }
    if (node.text) return { state: { tree, nodeId: id, ctx }, data: d, events };
    if (node.end) break;
    id = routeNext(node, d, ctx);
  }
  return { state: null, data: d, events };
}

export function startDialogue(tree: DialogueTree, data: GameData, ctx: DialogueCtx): DialogueStep {
  return enterNode(tree, tree.start, data, ctx);
}

export function currentNode(state: DialogueState): DialogueNode | undefined {
  return state.tree.nodes[state.nodeId];
}

export interface ChoiceView {
  choice: DialogueChoice;
  index: number;
  enabled: boolean;
}

export function visibleChoices(state: DialogueState, data: GameData): ChoiceView[] {
  const node = currentNode(state);
  return (node?.choices ?? [])
    .map((choice, index) => ({ choice, index, enabled: evalCondition(choice.if, data, state.ctx) }))
    .filter((c) => c.enabled || !!c.choice.lockedHint);
}

export function advanceDialogue(state: DialogueState, data: GameData): DialogueStep {
  const node = currentNode(state);
  if (!node || node.end) return { state: null, data, events: [] };
  if (node.choices?.length && visibleChoices(state, data).some((c) => c.enabled)) {
    return { state, data, events: [] };
  }
  const nextId = routeNext(node, data, state.ctx);
  if (!nextId) return { state: null, data, events: [] };
  return enterNode(state.tree, nextId, data, state.ctx);
}

export function chooseOption(state: DialogueState, data: GameData, index: number): DialogueStep {
  const node = currentNode(state);
  const choice = node?.choices?.[index];
  if (!choice || !evalCondition(choice.if, data, state.ctx)) return { state, data, events: [] };
  let d = data;
  const events: GameEvent[] = [];
  if (choice.effects?.length) {
    const r = applyEffects(d, choice.effects, state.ctx);
    d = r.data;
    events.push(...r.events);
  }
  if (choice.end || !choice.next) return { state: null, data: d, events };
  const step = enterNode(state.tree, choice.next, d, state.ctx);
  return { ...step, events: [...events, ...step.events] };
}

export function formatDialogueText(text: string, d: GameData): string {
  return text
    .replace(/\{time\}/g, formatClock(d.minutesLeft))
    .replace(/\{memories\}/g, String(d.memories.length))
    .replace(/\{scrap\}/g, String(d.scrap))
    .replace(/\{survivors\}/g, String(d.survivors.length))
    .replace(/\{level\}/g, String(d.level));
}
