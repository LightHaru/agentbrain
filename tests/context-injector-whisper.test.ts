import { describe, it, expect } from 'vitest';
import { ContextInjector } from '../src/integration/context-injector.js';
import { PriorityEnforcer } from '../src/integration/priority-enforcer.js';

/**
 * Regression: the Reasoning Whisper (a11y/design/verification guidance) must
 * reach the model even when higher-up Brain State blocks are large.
 *
 * Previously the whisper was appended mid-list and `trimToTokenBudget` kept
 * lines top-down, so a big facts/graph/conv block starved the whisper out of
 * the budget and it never reached the model on the live path.
 */
describe('ContextInjector — whisper survives trimming', () => {
  const makeInjector = () => new ContextInjector(new PriorityEnforcer([]));

  const bigBlock = (label: string) =>
    Array.from({ length: 12 }, (_, i) => `${label} fact ${i}: ` + 'x'.repeat(60)).join('\n');

  const whisper =
    '\n### Brain Whisper (Private support for Aira/OpenClaw)\n' +
    'Verification checks: add aria-labels | ensure focus-visible | semantic landmarks | contrast >= 4.5\n' +
    'Suggestion: use CSS design tokens (variables) not hardcoded values | no emoji as icons';

  const baseCtx = () =>
    ({
      classification: { topic: 'design', intent: 'build', sentiment: 'neutral' },
      emotionalState: { mood: 'content', valence: 0.3, arousal: 0.2 },
      personality: {},
      relationship: null,
      relevantMemories: [],
      topSkills: [],
      activeHabits: [],
      workingMemory: [],
      rewardTrend: 0,
      factsContext: 'Facts:\n' + bigBlock('F'),
      graphContext: 'Graph:\n' + bigBlock('G'),
      convContext: 'Conversation:\n' + bigBlock('C'),
      knowledgeContext: 'Knowledge:\n' + bigBlock('K'),
      reasoningWhisper: whisper,
    }) as any;

  it('keeps the whisper under a tight token budget', () => {
    const out = makeInjector().inject(baseCtx(), { maxTokens: 250 });
    expect(out).toContain('Brain Whisper');
    expect(out).toContain('aria-labels');
    expect(out).toContain('design tokens');
  });

  it('keeps the whisper even with very large upstream blocks', () => {
    const ctx = baseCtx();
    ctx.factsContext = 'Facts:\n' + bigBlock('F').repeat(4);
    ctx.graphContext = 'Graph:\n' + bigBlock('G').repeat(4);
    const out = makeInjector().inject(ctx, { maxTokens: 250 });
    expect(out).toContain('Brain Whisper');
    expect(out).toContain('aria-labels');
  });
});
