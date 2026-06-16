/**
 * Tests for ReasoningCortex - Brain Whisper System
 */

import { describe, expect, it } from 'vitest';
import { ReasoningCortex } from '../src/core/reasoning-cortex.js';
import { formatWhisper } from '../src/integration/brain-whisper-format.js';
import { defaultConfig, type BrainConfig } from '../src/core/config.js';
import type { Hippocampus } from '../src/core/hippocampus.js';
import type { TemporalLobe } from '../src/core/temporal.js';
import type { Memory } from '../src/index.js';

const now = new Date().toISOString();

function memory(content: string, type: Memory['type'] = 'semantic'): Memory {
  return {
    id: `m-${Math.random().toString(36).slice(2, 8)}`,
    type,
    content,
    timestamp: now,
    confidence: 0.85,
    accessCount: 1,
    lastAccessed: now,
    tags: ['coding'],
  };
}

function createCortex(
  config: Partial<BrainConfig> = {},
  recallResults: Memory[] = []
): ReasoningCortex {
  const hippocampus = {
    recall: async () => recallResults,
  } as unknown as Hippocampus;

  return new ReasoningCortex(
    { ...defaultConfig, ...config },
    hippocampus,
    {} as TemporalLobe
  );
}

describe('ReasoningCortex', () => {
  it('returns a whisper id and records outcome updates', async () => {
    const cortex = createCortex({}, [
      memory('AgentBrain API failures should be reproduced before patching.'),
    ]);

    const whisper = await cortex.generateWhisper({
      userMessage: 'Fix the API bug and verify the tests',
    });

    expect(whisper.whisperId).toMatch(/^w-/);
    expect(whisper.taskType).toBe('troubleshooting');
    expect(whisper.relevantMemories.length).toBeGreaterThan(0);
    expect(cortex.getStatistics().totalWhispers).toBe(1);

    cortex.recordOutcome(whisper.whisperId, false, 0.2);
    expect(cortex.getStatistics().successRate).toBe(0);
  });

  it('honors configured max tokens', async () => {
    const cortex = createCortex({
      reasoningWhisper: { enabled: true, maxTokens: 80 },
    });

    const whisper = await cortex.generateWhisper({
      userMessage: 'Plan the database migration and rollout',
    });

    expect(whisper.tokenBudget).toBe(80);
  });

  it('returns a no-op whisper when disabled', async () => {
    const cortex = createCortex({
      reasoningWhisper: { enabled: false, maxTokens: 120 },
    });

    const whisper = await cortex.generateWhisper({
      userMessage: 'Fix the production API bug',
    });

    expect(whisper.whisperId).toMatch(/^w-/);
    expect(whisper.tokenBudget).toBe(0);
    expect(whisper.suggestions).toEqual([]);
    expect(cortex.getStatistics().totalWhispers).toBe(0);
  });

  it('skips casual whispers in very large contexts', async () => {
    const cortex = createCortex();

    const whisper = await cortex.generateWhisper({
      userMessage: 'ok thanks',
      contextTokens: 90000,
    });

    expect(whisper.taskType).toBe('casual');
    expect(whisper.tokenBudget).toBe(0);
    expect(whisper.relevantMemories).toEqual([]);
    expect(whisper.cautions).toEqual([]);
  });

  it('builds a support-only deep reasoning scaffold for complex Aira tasks', async () => {
    const cortex = createCortex({}, [
      memory('Aira uses OpenClaw as the main agent and AgentBrain as private advisory support.'),
      memory('AgentBrain should preserve context injection, memory recall, and verification behavior.'),
      memory('Brain Whisper should guide reasoning without replacing the final assistant response.'),
    ]);

    const whisper = await cortex.generateWhisper({
      userMessage: 'Plan the full AgentBrain OpenClaw rollout and then validate memory, context injection, VPS deployment, plugin tools, fallback behavior, and user-facing answer quality.',
    });

    expect(whisper.supportRole).toBe('advisor-only');
    expect(whisper.handoffDirective).toContain('Aira/OpenClaw owns');
    expect(whisper.advisorModel?.model).toBe('Qwen3-4B');
    expect(whisper.advisorModel?.role).toBe('verifier-only');
    expect(whisper.thinkingMode).toBe('deep');
    expect(whisper.reasoningFrame.length).toBeGreaterThan(0);
    expect(whisper.verificationChecks.join(' ')).toContain('hidden dependencies');
    expect(whisper.verificationChecks.join(' ')).toContain('Do not reveal Brain Whisper');

    const formatted = formatWhisper(whisper);
    expect(formatted).toContain('Private support for Aira/OpenClaw');
    expect(formatted).toContain('Role: Use as private support only');
    expect(formatted).toContain('Advisor model: Qwen3-4B (verifier-only)');
    expect(formatted).toContain('never final answer');
    expect(formatted).toContain('Reasoning frame:');
    expect(formatted).toContain('Verification checks:');
    expect(formatted).not.toContain('chain-of-thought');
  });

  it('surfaces uncertainty instead of pretending unsupported context is known', async () => {
    const cortex = createCortex();

    const whisper = await cortex.generateWhisper({
      userMessage: 'Maybe handle this vague multi-step situation and make it perfect somehow?',
    });

    expect(whisper.thinkingMode).toBe('reflective');
    expect(whisper.uncertaintySignals).toContain('no strong memory match');
    expect(whisper.uncertaintySignals.join(' ')).toContain('uncertainty');
    expect(whisper.reasoningFrame.join(' ')).toContain('clarification');
  });

  it('teaches source filtering and recovery instead of memorized answers', async () => {
    const cortex = createCortex({}, [
      memory('Old cached status pages can be stale and should only be used as routing hints.'),
    ]);

    const whisper = await cortex.generateWhisper({
      userMessage: 'Find the latest service status, verify the source, and tell me if the first result looks wrong.',
    });

    expect(whisper.playbookIds).toContain('evidence-triangulation-live');
    expect(whisper.evidenceRules.join(' ')).toContain('Primary/structured API');
    expect(whisper.evidenceRules.join(' ')).toContain('beats ticker/name-only matches');
    expect(whisper.recoverySteps.join(' ')).toContain('search again');
    expect(whisper.recoverySteps.join(' ')).toContain('try the source API');
    expect(whisper.recoverySteps.join(' ')).toContain('If two credible sources disagree');
    expect(whisper.verificationChecks.join(' ')).toContain('source freshness');

    const formatted = formatWhisper(whisper);
    expect(formatted).toContain('Evidence rules:');
    expect(formatted).toContain('If evidence fails:');
    expect(formatted).not.toContain('current price is');
  });

  it('trains Aira to verify generated landing pages instead of only writing files', async () => {
    const cortex = createCortex({}, [
      memory('Past UI tasks failed when mobile text was clipped and pages were not rendered before final answer.'),
    ]);

    const whisper = await cortex.generateWhisper({
      userMessage: 'Create two random responsive landing pages with HTML CSS JS, then verify desktop and mobile render quality.',
    });

    expect(whisper.playbookIds).toContain('frontend-artifact-quality');
    expect(whisper.suggestions.join(' ')).toContain('working artifact');
    expect(whisper.reasoningFrame.join(' ')).toContain('File existence is not evidence');
    expect(whisper.verificationChecks.join(' ')).toContain('desktop and mobile');
    expect(whisper.verificationChecks.join(' ')).toContain('console errors');
    expect(whisper.verificationChecks.join(' ')).toContain('horizontal scroll');
    expect(whisper.sourcePlan.join(' ')).toContain('Render every generated page');
    expect(whisper.answerContract.join(' ')).toContain('created paths');
    expect(whisper.answerContract.join(' ')).toContain('browser verification was not actually run');
    expect(whisper.evidenceRules.join(' ')).toContain('Do not claim browser/render verification');
    expect(whisper.evidenceRules.join(' ')).toContain('browser render or screenshot');
    expect(whisper.evidenceRules.join(' ')).toContain('Readable text');
    expect(whisper.evidenceRules.join(' ')).toContain('AI-generated');
    expect(whisper.evidenceRules.join(' ')).toContain('Specific real-world details');
    expect(whisper.evidenceRules.join(' ')).toContain('Reveal-on-scroll animations');
    expect(whisper.recoverySteps.join(' ')).toContain('re-render');
    expect(whisper.recoverySteps.join(' ')).toContain('mobile text overlaps');
    expect(whisper.recoverySteps.join(' ')).toContain('concrete scenario');
    expect(whisper.cautions.join(' ')).toContain('verified working page');
    expect(whisper.cautions.join(' ')).toContain('Do not claim a browser check');
    expect(whisper.cautions.join(' ')).toContain('generic AI template');
    expect(whisper.uncertaintySignals).toContain('mobile text-fit risk');
    expect(whisper.uncertaintySignals).toContain('AI-template visual risk');

    const formatted = formatWhisper(whisper);
    expect(formatted).toContain('Verification checks:');
    expect(formatted).toContain('desktop and mobile');
    expect(formatted).toContain('Evidence rules:');
    expect(formatted).toContain('Do not claim browser/render verification');
    expect(formatted).toContain('browser render or screenshot');
    expect(formatted).toContain('If evidence fails:');
    expect(formatted).toContain('re-render');
  });

  it('trains Aira away from AI-looking landing pages toward lived-in realism', async () => {
    const cortex = createCortex({}, [
      memory('Recent landing pages looked too AI-generated: empty mockups, generic copy, and reveal animations left screenshot gaps.'),
    ]);

    const whisper = await cortex.generateWhisper({
      userMessage: 'Trang landing page nay nhin AI qua, phai that va song dong hon, tao lai va kiem screenshot mobile desktop.',
    });

    expect(whisper.playbookIds).toContain('frontend-artifact-quality');
    expect(whisper.taskType).toBe('creative');
    expect(whisper.tokenBudget).toBeGreaterThanOrEqual(560);
    expect(whisper.suggestions.join(' ')).toContain('authentic and lived-in');
    expect(whisper.reasoningFrame.join(' ')).toContain('Realism check');
    expect(whisper.verificationChecks.join(' ')).toContain('AI-template signals');
    expect(whisper.verificationChecks.join(' ')).toContain('no-scroll screenshot');
    expect(whisper.sourcePlan.join(' ')).toContain('domain-specific copy');
    expect(whisper.answerContract.join(' ')).toContain('generic/AI-made');
    expect(whisper.evidenceRules.join(' ')).toContain('decorative geometry without purpose');
    expect(whisper.evidenceRules.join(' ')).toContain('actual workflow screenshots');
    expect(whisper.recoverySteps.join(' ')).toContain('lived-in details');

    const formatted = formatWhisper(whisper);
    expect(formatted).toContain('authentic and lived-in');
    expect(formatted).toContain('AI-template signals');
    expect(formatted).toContain('decorative geometry without purpose');
    expect(formatted).toContain('no-scroll screenshot');
  });

  it('keeps Qwen3-4B advisory for code/tool work and requires real tool evidence', async () => {
    const cortex = createCortex({}, [
      memory('Tool claims should be tied to command output, not assumptions.'),
    ]);

    const whisper = await cortex.generateWhisper({
      userMessage: 'Use code tools to inspect the plugin hook, fix the bug, run targeted tests and build, then report exact tool failures.',
    });

    expect(whisper.playbookIds).toContain('code-tool-execution-quality');
    expect(whisper.advisorModel?.model).toBe('Qwen3-4B');
    expect(whisper.advisorModel?.role).toBe('verifier-only');
    expect(whisper.suggestions.join(' ')).toContain('Aira/OpenClaw as the operator');
    expect(whisper.reasoningFrame.join(' ')).toContain('Separate observed tool output');
    expect(whisper.verificationChecks.join(' ')).toContain('Run targeted tests');
    expect(whisper.sourcePlan.join(' ')).toContain('repo scripts');
    expect(whisper.answerContract.join(' ')).toContain('changed files');
    expect(whisper.evidenceRules.join(' ')).toContain('Never claim a test, build, tool call, or browser check passed');
    expect(whisper.evidenceRules.join(' ')).toContain('Advisor model feedback is weaker than direct tool output');
    expect(whisper.recoverySteps.join(' ')).toContain('rerun the relevant check');
    expect(whisper.cautions.join(' ')).toContain('Do not let Qwen or AgentBrain replace Aira');
    expect(whisper.uncertaintySignals).toContain('tool output missing');

    const formatted = formatWhisper(whisper);
    expect(formatted).toContain('Advisor model: Qwen3-4B');
    expect(formatted).toContain('Never claim a test, build, tool call');
    expect(formatted).toContain('Run targeted tests');
  });

  it('matches Vietnamese Aira prompts for frontend and code-tool playbooks', async () => {
    const cortex = createCortex();

    const landingWhisper = await cortex.generateWhisper({
      userMessage: 'Aira hay tao landing page dep responsive roi kiem tra desktop mobile that.',
    });

    expect(landingWhisper.playbookIds).toContain('frontend-artifact-quality');
    expect(landingWhisper.taskType).toBe('creative');
    expect(landingWhisper.tokenBudget).toBeGreaterThanOrEqual(300);
    expect(landingWhisper.verificationChecks.join(' ')).toContain('desktop and mobile');
    expect(landingWhisper.evidenceRules.join(' ')).toContain('Do not claim browser/render verification');

    const accentedLandingWhisper = await cortex.generateWhisper({
      userMessage: 'Aira h\u00e3y t\u1ea1o giao di\u1ec7n web responsive r\u1ed3i ki\u1ec3m tra mobile desktop th\u1eadt.',
    });

    expect(accentedLandingWhisper.playbookIds).toContain('frontend-artifact-quality');
    expect(accentedLandingWhisper.taskType).toBe('creative');

    const codeWhisper = await cortex.generateWhisper({
      userMessage: 'Aira hay chay tool kiem tra repo, sua bug va bao test that.',
    });

    expect(codeWhisper.playbookIds).toContain('code-tool-execution-quality');
    expect(codeWhisper.taskType).toBe('troubleshooting');
    expect(codeWhisper.advisorModel?.model).toBe('Qwen3-4B');
    expect(codeWhisper.advisorModel?.role).toBe('verifier-only');
    expect(codeWhisper.tokenBudget).toBeGreaterThanOrEqual(300);
    expect(codeWhisper.evidenceRules.join(' ')).toContain('Never claim a test, build, tool call');
    expect(codeWhisper.cautions.join(' ')).toContain('Do not let Qwen or AgentBrain replace Aira');
  });

  it('uses trained market-data playbooks for PRL price without inventing a price', async () => {
    const cortex = createCortex({}, [
      memory('Past routing hint: PRL price should be checked on DexScreener, but old prices are stale.'),
    ]);

    const whisper = await cortex.generateWhisper({
      userMessage: 'Giá token PRL bây giờ bao nhiêu?',
    });

    expect(whisper.taskType).toBe('market-data');
    expect(whisper.playbookIds).toContain('market-token-price-live');
    expect(whisper.playbookIds).toContain('prl-wprl-dexscreener');
    expect(whisper.sourcePlan.join(' ')).toContain('DexScreener');
    expect(whisper.sourcePlan.join(' ')).toContain('exact WPRL pair');
    expect(whisper.sourcePlan.join(' ')).toContain('api.dexscreener.com/latest/dex/search');
    expect(whisper.sourcePlan.join(' ')).toContain('prl-pearl-1');
    expect(whisper.sourcePlan.join(' ')).toContain('wprl-pearlbridge-bridged-wprl-ethereum');
    expect(whisper.sourcePlan.join(' ')).toContain('q=PRL');
    expect(whisper.sourcePlan.join(' ')).toContain('q=WPRL');
    expect(whisper.sourcePlan.join(' ')).toContain('current API priceUsd');
    expect(whisper.sourcePlan.join(' ')).toContain('same API candidate row');
    expect(whisper.sourcePlan.join(' ')).toContain('never reuse price, volume, change, or timestamp between IDs');
    expect(whisper.answerContract.join(' ')).toContain('priceUsd');
    expect(whisper.answerContract.join(' ')).toContain('ambiguous');
    expect(whisper.answerContract.join(' ')).toContain('stale Perle/Parallel listings');
    expect(whisper.answerContract.join(' ')).toContain('same live source row');
    expect(whisper.answerContract.join(' ')).toContain('source-specific API prices');
    expect(whisper.answerContract.join(' ')).toContain('exact ticker id');
    expect(whisper.answerContract.join(' ')).toContain('price/volume/change');
    expect(whisper.evidenceRules.join(' ')).toContain('Primary/structured API');
    expect(whisper.evidenceRules.join(' ')).toContain('bare PRL request is not enough');
    expect(whisper.evidenceRules.join(' ')).toContain('Every reported metric');
    expect(whisper.evidenceRules.join(' ')).toContain('separate evidence rows');
    expect(whisper.evidenceRules.join(' ')).toContain('exact pair API value');
    expect(whisper.evidenceRules.join(' ')).toContain('older listing-page quote');
    expect(whisper.evidenceRules.join(' ')).toContain('conflict rather than merging');
    expect(whisper.recoverySteps.join(' ')).toContain('search again');
    expect(whisper.recoverySteps.join(' ')).toContain('try the source API');
    expect(whisper.recoverySteps.join(' ')).toContain('compare WPRL/Pearl');
    expect(whisper.recoverySteps.join(' ')).toContain('report the conflict');
    expect(whisper.recoverySteps.join(' ')).toContain('stale sources');
    expect(whisper.recoverySteps.join(' ')).toContain('same-source API row');
    expect(whisper.verificationChecks.join(' ')).toContain('base token should be Wrapped Pearl');
    expect(whisper.cautions.join(' ')).toContain('cached memory');
    expect(whisper.cautions.join(' ')).toContain('ambiguous ticker');
    expect(whisper.uncertaintySignals).toContain('live market data required');
    expect(whisper.uncertaintySignals).toContain('bare PRL ticker ambiguity');

    const formatted = formatWhisper(whisper);
    expect(formatted).toContain('Task detected: market-data');
    expect(formatted).toContain('Evidence rules:');
    expect(formatted).toContain('If evidence fails:');
    expect(formatted).toContain('source API');
    expect(formatted).toContain('Live-source plan:');
    expect(formatted).toContain('q=WPRL');
    expect(formatted).toContain('Answer must include:');
    expect(formatted).toContain('top candidates');
    expect(formatted).toContain('stale Perle/Parallel listings');
    expect(formatted).toContain('same live source row');
    expect(formatted).toContain('source-specific API prices');
    expect(formatted).toContain('exact ticker id');
    expect(formatted).toContain('never reuse price, volume, change, or timestamp between IDs');
    expect(formatted).not.toContain('$0.4804');
  });
});
