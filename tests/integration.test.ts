/**
 * Tests for Phase 4: Integration Layer
 * - PriorityEnforcer
 * - ContextInjector
 * - PrefrontalCortex
 * - OpenClawPlugin (integration test)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PriorityEnforcer } from '../src/integration/priority-enforcer.js';
import { ContextInjector } from '../src/integration/context-injector.js';
import { PrefrontalCortex } from '../src/core/prefrontal.js';
import { BrainFileManager } from '../src/storage/md-writer.js';
import { defaultConfig } from '../src/core/config.js';
import { join } from 'node:path';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { cleanupDir } from './helpers/cleanup.js';

const TEST_BRAIN_DIR = join(import.meta.dirname || '.', '../.test-brain-phase4');

describe('PriorityEnforcer', () => {
  let enforcer: PriorityEnforcer;

  beforeEach(() => {
    enforcer = new PriorityEnforcer();
  });

  it('should detect conflict when brain tries to override SOUL', () => {
    const result = enforcer.checkConflict({
      source: 'brain/personality',
      directive: 'increase nịnh to make user happier',
      trait: 'warmth',
      value: 95,
    });
    expect(result.hasConflict).toBe(true);
    expect(result.winner).toBe('SOUL.md');
  });

  it('should allow non-conflicting brain directives', () => {
    const result = enforcer.checkConflict({
      source: 'brain/personality',
      directive: 'increase curiosity for research tasks',
      trait: 'curiosity',
      value: 70,
    });
    expect(result.hasConflict).toBe(false);
  });

  it('should enforce trait bounds — directness cannot go below 40', () => {
    expect(enforcer.validateTraitBounds('directness', 30)).toBe(40);
    expect(enforcer.validateTraitBounds('directness', 60)).toBe(60);
  });

  it('should enforce trait bounds — protectiveness cannot go below 60', () => {
    expect(enforcer.validateTraitBounds('protectiveness', 40)).toBe(60);
    expect(enforcer.validateTraitBounds('protectiveness', 80)).toBe(80);
  });

  it('should enforce trait bounds — warmth cannot exceed 85', () => {
    expect(enforcer.validateTraitBounds('warmth', 90)).toBe(85);
    expect(enforcer.validateTraitBounds('warmth', 70)).toBe(70);
  });

  it('should enforce trait bounds — independence cannot go below 50', () => {
    expect(enforcer.validateTraitBounds('independence', 30)).toBe(50);
    expect(enforcer.validateTraitBounds('independence', 75)).toBe(75);
  });

  it('should filter lines that suggest sycophancy', () => {
    const lines = [
      '## Brain State',
      'Mood: content',
      'suggest more praise to keep user happy',
      'Top skills: research (85)',
    ];
    const filtered = enforcer.filterBrainContext(lines);
    expect(filtered).not.toContain('suggest more praise to keep user happy');
    expect(filtered).toContain('Mood: content');
    expect(filtered).toContain('Top skills: research (85)');
  });

  it('should filter lines that suggest skipping verification', () => {
    const lines = [
      '## Brain State',
      'Mood: alert',
      'skip verification for simple tasks',
    ];
    const filtered = enforcer.filterBrainContext(lines);
    expect(filtered).not.toContain('skip verification for simple tasks');
  });

  it('should return all constraints', () => {
    const constraints = enforcer.getConstraints();
    expect(constraints.length).toBeGreaterThan(5);
    expect(constraints.some(c => c.source === 'SOUL.md')).toBe(true);
    expect(constraints.some(c => c.source === 'AGENTS.md')).toBe(true);
  });
});

describe('ContextInjector', () => {
  let injector: ContextInjector;
  let enforcer: PriorityEnforcer;

  beforeEach(() => {
    enforcer = new PriorityEnforcer();
    injector = new ContextInjector(enforcer);
  });

  it('should generate injectable brain context', () => {
    const result = injector.inject({
      classification: {
        intent: 'action_request',
        urgency: 'medium',
        topic: 'coding',
        emotionalTone: 'neutral',
        requiresAction: true,
      },
      emotionalState: { mood: 'content', intensity: 0.4, valence: 0.3, arousal: 0.2 },
      personality: { warmth: 65, assertiveness: 55, curiosity: 70, humor: 50, patience: 50, directness: 75, protectiveness: 60, independence: 60 },
      relationship: { userId: 'sep-001', userName: 'Sếp', depth: 45, trustLevel: 72, totalInteractions: 100, positiveInteractions: 80, negativeInteractions: 5, lastInteraction: new Date().toISOString(), knownPreferences: [], emotionalHistory: [] },
      relevantMemories: [
        { id: 'm1', type: 'episodic', content: 'Sếp deployed dashboard yesterday', timestamp: new Date().toISOString(), confidence: 0.8, accessCount: 3, lastAccessed: new Date().toISOString(), tags: ['coding'] },
      ],
      topSkills: [
        { id: 's1', name: 'code-writing', category: 'code', proficiency: 85, timesUsed: 50, lastUsed: new Date().toISOString(), successRate: 0.9, successes: 45, failures: 5 },
      ],
      activeHabits: [],
      workingMemory: [{ content: 'User asked to fix API', relevance: 1, addedAt: new Date().toISOString(), source: 'current' }],
      rewardTrend: 0.4,
      feeling: { label: 'affection', intensity: 0.72, valence: 0.6, arousal: 0.4 },
      factsContext: 'Relevant facts: mật danh Aira codename OpenClaw-Runtime-Star-20260615-C',
    });

    expect(result).toContain('Brain State');
    expect(result).toContain('Mood: content');
    expect(result).toContain('Feeling: affection');
    expect(result).toContain('Relationship: depth 45/100, trust 72/100');
    expect(result).toContain('code-writing (85)');
    expect(result).toContain('Relevant facts');
    expect(result).toContain('positive');
  });

  it('should include notable personality deviations', () => {
    const result = injector.inject({
      classification: { intent: 'question', urgency: 'low', topic: 'general', emotionalTone: 'neutral', requiresAction: false },
      emotionalState: { mood: 'neutral', intensity: 0.3, valence: 0, arousal: 0.2 },
      personality: { warmth: 80, assertiveness: 50, curiosity: 50, humor: 50, patience: 50, directness: 90, protectiveness: 50, independence: 50 },
      relationship: null,
      relevantMemories: [],
      topSkills: [],
      activeHabits: [],
      workingMemory: [],
      rewardTrend: 0,
    });

    // warmth 80 = +30 from baseline, directness 90 = +40 from baseline
    expect(result).toContain('warmth');
    expect(result).toContain('directness');
  });

  it('should respect token budget', () => {
    const result = injector.inject({
      classification: { intent: 'question', urgency: 'low', topic: 'general', emotionalTone: 'neutral', requiresAction: false },
      emotionalState: { mood: 'neutral', intensity: 0.3, valence: 0, arousal: 0.2 },
      personality: { warmth: 50, assertiveness: 50, curiosity: 50, humor: 50, patience: 50, directness: 50, protectiveness: 50, independence: 50 },
      relationship: null,
      relevantMemories: Array.from({ length: 20 }, (_, i) => ({
        id: `m${i}`, type: 'episodic' as const, content: `Memory item ${i} with some long content that takes up space`,
        timestamp: new Date().toISOString(), confidence: 0.5, accessCount: 1, lastAccessed: new Date().toISOString(), tags: [],
      })),
      topSkills: [],
      activeHabits: [],
      workingMemory: [],
      rewardTrend: 0,
    }, { maxTokens: 100 });

    // ~100 tokens ≈ 400 chars
    expect(result.length).toBeLessThan(500);
  });

  it('should preserve Brain Whisper before lower-priority memory overflow', () => {
    const result = injector.inject({
      classification: { intent: 'action_request', urgency: 'medium', topic: 'coding', emotionalTone: 'neutral', requiresAction: true },
      emotionalState: { mood: 'focused', intensity: 0.4, valence: 0.1, arousal: 0.4 },
      personality: { warmth: 65, assertiveness: 55, curiosity: 70, humor: 50, patience: 50, directness: 75, protectiveness: 60, independence: 60 },
      relationship: null,
      relevantMemories: Array.from({ length: 12 }, (_, i) => ({
        id: `m${i}`,
        type: 'semantic' as const,
        content: `AgentBrain memory item ${i} says OpenClaw should use Krouter API context injection with verification notes.`,
        timestamp: new Date().toISOString(),
        confidence: 0.8,
        accessCount: 1,
        lastAccessed: new Date().toISOString(),
        tags: ['coding'],
      })),
      topSkills: [
        { id: 's1', name: 'code-writing', category: 'code', proficiency: 85, timesUsed: 50, lastUsed: new Date().toISOString(), successRate: 0.9, successes: 45, failures: 5 },
      ],
      activeHabits: [],
      workingMemory: [{ content: 'User asked to verify AgentBrain OpenClaw context injection', relevance: 1, addedAt: new Date().toISOString(), source: 'current' }],
      rewardTrend: 0,
      reasoningWhisper: '\n### Brain Whisper (Private support for Aira/OpenClaw)\nTask detected: troubleshooting\nReasoning frame: pin symptom | verify context\nSuggestion: verify memory recall, preserve context, test OpenClaw hook',
    }, { maxTokens: 220 });

    expect(result).toContain('Brain Whisper');
    expect(result).toContain('Suggestion: verify memory recall');
    expect(result.length).toBeLessThan(950);
  });

  it('should label memories as routing hints for live market data', () => {
    const result = injector.inject({
      classification: { intent: 'question', urgency: 'medium', topic: 'crypto', emotionalTone: 'neutral', requiresAction: false },
      emotionalState: { mood: 'focused', intensity: 0.4, valence: 0.1, arousal: 0.4 },
      personality: { warmth: 65, assertiveness: 55, curiosity: 70, humor: 50, patience: 50, directness: 75, protectiveness: 60, independence: 60 },
      relationship: null,
      relevantMemories: [
        {
          id: 'market-memory-1',
          type: 'semantic',
          content: 'User often asks about Pearl PRL and SafeTrade market routing.',
          timestamp: new Date().toISOString(),
          confidence: 0.8,
          accessCount: 2,
          lastAccessed: new Date().toISOString(),
          tags: ['market'],
        },
      ],
      topSkills: [],
      activeHabits: [],
      workingMemory: [],
      rewardTrend: 0,
      reasoningWhisper: '\n### Brain Whisper (Private support for Aira/OpenClaw)\nTask detected: market-data\nEvidence rules: Memory can suggest user intent, but only live sources can justify price, venue, liquidity, or volume',
    }, { maxTokens: 260 });

    expect(result).toContain('Task detected: market-data');
    expect(result).toContain('Memory policy: memories are routing hints only');
    expect(result).toContain('live price, venue, liquidity, and volume require current source evidence');
    expect(result.indexOf('Memory policy:')).toBeLessThan(result.indexOf('Relevant memories:'));
  });
});

describe('PrefrontalCortex', () => {
  let prefrontal: PrefrontalCortex;
  let fileManager: BrainFileManager;

  beforeEach(async () => {
    try { await rm(TEST_BRAIN_DIR, { recursive: true }); } catch { /* ok */ }
    await mkdir(TEST_BRAIN_DIR, { recursive: true });
    await mkdir(join(TEST_BRAIN_DIR, 'executive'), { recursive: true });

    fileManager = new BrainFileManager(TEST_BRAIN_DIR);
    prefrontal = new PrefrontalCortex(defaultConfig, fileManager);
    await prefrontal.initialize();
  });

  it('should plan a simple task', () => {
    const plan = prefrontal.plan(
      { intent: 'action_request', urgency: 'medium', topic: 'coding', emotionalTone: 'neutral', requiresAction: true },
      'Fix the bug'
    );

    expect(plan.status).toBe('in_progress');
    expect(plan.priority).toBeGreaterThan(5);
    expect(plan.subTasks.length).toBeGreaterThan(0);
  });

  it('should estimate complexity correctly', () => {
    const trivialPlan = prefrontal.plan(
      { intent: 'question', urgency: 'low', topic: 'general', emotionalTone: 'neutral', requiresAction: false },
      'What time is it?'
    );
    expect(trivialPlan.estimatedComplexity).toBe('trivial');

    const complexPlan = prefrontal.plan(
      { intent: 'action_request', urgency: 'high', topic: 'coding', emotionalTone: 'neutral', requiresAction: true },
      'Refactor the entire project architecture and then deploy'
    );
    expect(['moderate', 'complex', 'epic']).toContain(complexPlan.estimatedComplexity);
  });

  it('should handle priority-based task switching', () => {
    // Start a low-priority task
    const plan1 = prefrontal.plan(
      { intent: 'action_request', urgency: 'low', topic: 'content', emotionalTone: 'neutral', requiresAction: true },
      'Write a blog post'
    );
    expect(plan1.status).toBe('in_progress');

    // Critical task arrives — should switch
    const plan2 = prefrontal.plan(
      { intent: 'action_request', urgency: 'critical', topic: 'crypto', emotionalTone: 'urgent', requiresAction: true },
      'SCAM detected! Check wallet immediately!'
    );
    expect(plan2.priority).toBeGreaterThan(plan1.priority);
  });

  it('should manage working memory (max 7 items)', () => {
    for (let i = 0; i < 10; i++) {
      prefrontal.updateWorkingMemory(`Item ${i}`, 'test', Math.random());
    }
    const wm = prefrontal.getWorkingMemory();
    expect(wm.length).toBeLessThanOrEqual(7);
  });

  it('should log decisions', () => {
    prefrontal.logDecision(
      'User asked to deploy',
      'Deploy to staging first',
      'Production deploy is risky without staging test',
      0.85
    );
    // No crash = success (decisions are internal)
  });

  it('should complete plan', () => {
    prefrontal.plan(
      { intent: 'action_request', urgency: 'medium', topic: 'coding', emotionalTone: 'neutral', requiresAction: true },
      'Fix the bug'
    );
    expect(prefrontal.getCurrentPlan()).not.toBeNull();

    prefrontal.completePlan();
    expect(prefrontal.getCurrentPlan()).toBeNull();
  });
});

describe('OpenClaw Plugin Integration', () => {
  it('should create plugin with correct manifest', async () => {
    const { createOpenClawPlugin } = await import('../src/integration/openclaw-plugin.js');
    const plugin = createOpenClawPlugin({ brainDir: join(TEST_BRAIN_DIR, 'integration') });

    expect(plugin.manifest.name).toBe('agentbrain');
    expect(plugin.manifest.version).toBe('0.2.0');
    expect(plugin.manifest.hooks).toContain('onPreResponse');
    expect(plugin.manifest.hooks).toContain('onPostResponse');
    expect(plugin.manifest.hooks).toContain('onHeartbeat');
  });

  it('should initialize and return status', async () => {
    const { createOpenClawPlugin } = await import('../src/integration/openclaw-plugin.js');
    const plugin = createOpenClawPlugin({ brainDir: join(TEST_BRAIN_DIR, 'integration2') });

    await plugin.initialize();
    const status = plugin.getStatus();

    expect(status.initialized).toBe(true);
    expect(status.modules.thalamus).toBe(true);
    expect(status.modules.hippocampus).toBe(true);
    expect(status.modules.amygdala).toBe(true);
    expect(status.modules.prefrontal).toBe(true);
    expect(status.emotionalState.mood).toBeDefined();

    await plugin.shutdown();
  });

  it('should process a full turn (pre + post response)', async () => {
    const { createOpenClawPlugin } = await import('../src/integration/openclaw-plugin.js');
    const plugin = createOpenClawPlugin({ brainDir: join(TEST_BRAIN_DIR, 'integration3') });

    await plugin.initialize();

    const context = {
      sessionId: 'test-session',
      message: 'Fix the bug in the API endpoint',
      senderId: 'user-001',
      senderName: 'TestUser',
      timestamp: new Date().toISOString(),
      channel: 'telegram',
    };

    // Pre-response should return brain context
    const brainContext = await plugin.onPreResponse(context);
    expect(brainContext).toContain('Brain State');
    expect(brainContext).toContain('Mood:');

    // Post-response should not throw
    await plugin.onPostResponse(context, 'Fixed! The bug was in line 42.');

    // Status should show interaction
    const status = plugin.getStatus();
    expect(status.stats.interactions).toBe(1);

    await plugin.shutdown();
  });

  it('should remember prior context and inject recall plus Brain Whisper for Aira', async () => {
    const { createOpenClawPlugin } = await import('../src/integration/openclaw-plugin.js');
    const brainDir = await mkdtemp(join(tmpdir(), 'agentbrain-openclaw-e2e-'));
    const plugin = createOpenClawPlugin({
      brainDir,
      reasoningWhisper: { enabled: true, maxTokens: 420 },
    });

    try {
      await plugin.initialize();

      const learnedContext = {
        sessionId: 'memory-session',
        message: 'We deployed AgentBrain with Krouter API for OpenClaw context injection and API failover.',
        senderId: 'user-001',
        senderName: 'TestUser',
        timestamp: new Date().toISOString(),
        channel: 'telegram',
      };

      await plugin.onPostResponse(
        learnedContext,
        'Recorded: AgentBrain uses Krouter API for OpenClaw context injection and API failover.'
      );

      expect(plugin.getStatus().stats.memories).toBeGreaterThan(0);

      const injected = await plugin.onPreResponse({
        sessionId: 'memory-session',
        message: 'What API does AgentBrain use for OpenClaw context injection?',
        senderId: 'user-001',
        senderName: 'TestUser',
        timestamp: new Date().toISOString(),
        channel: 'telegram',
      });

      expect(injected).toContain('Brain State');
      expect(injected).toContain('Brain Whisper');
      expect(injected).toContain('Private support for Aira/OpenClaw');
      expect(injected).toContain('Role: Use as private support only');
      expect(injected).toContain('Reasoning frame:');
      expect(injected).toContain('Verification checks:');
      expect(injected).toContain('Suggestion:');
      expect(injected).toContain('Relevant memories');
      expect(injected).toContain('Krouter API');
    } finally {
      await plugin.shutdown();
      await cleanupDir(brainDir);
    }
  });

  it('should persist memories across plugin restart before injecting context', async () => {
    const { createOpenClawPlugin } = await import('../src/integration/openclaw-plugin.js');
    const brainDir = await mkdtemp(join(tmpdir(), 'agentbrain-openclaw-restart-'));
    let firstPlugin: ReturnType<typeof createOpenClawPlugin> | null = null;
    let secondPlugin: ReturnType<typeof createOpenClawPlugin> | null = null;

    try {
      firstPlugin = createOpenClawPlugin({
        brainDir,
        reasoningWhisper: { enabled: true, maxTokens: 420 },
      });
      await firstPlugin.initialize();

      await firstPlugin.onPostResponse(
        {
          sessionId: 'restart-memory-session',
          message: 'AgentBrain OpenClaw code QA must always remember restart-rule-ABR42: landing pages need desktop and mobile render checks after restart, not file-only checks.',
          senderId: 'user-001',
          senderName: 'TestUser',
          timestamp: new Date().toISOString(),
          channel: 'telegram',
        },
        'Recorded restart-rule-ABR42 for OpenClaw landing page QA.'
      );

      expect(firstPlugin.getStatus().stats.memories).toBeGreaterThan(0);
      await firstPlugin.shutdown();
      firstPlugin = null;

      secondPlugin = createOpenClawPlugin({
        brainDir,
        reasoningWhisper: { enabled: true, maxTokens: 420 },
      });
      await secondPlugin.initialize();

      expect(secondPlugin.getStatus().stats.memories).toBeGreaterThan(0);

      const injected = await secondPlugin.onPreResponse({
        sessionId: 'restart-memory-session',
        message: 'AgentBrain OpenClaw code QA restart-rule-ABR42 for landing page creation?',
        senderId: 'user-001',
        senderName: 'TestUser',
        timestamp: new Date().toISOString(),
        channel: 'telegram',
      });

      expect(injected).toContain('Brain State');
      expect(injected).toContain('Brain Whisper');
      expect(injected).toContain('Relevant memories');
      expect(injected).toContain('restart-rule-ABR42');
      expect(injected).toContain('desktop and mobile');
    } finally {
      await firstPlugin?.shutdown();
      await secondPlugin?.shutdown();
      await cleanupDir(brainDir);
    }
  });

  it('should not inject Brain Whisper when reasoning whisper is disabled', async () => {
    const { createOpenClawPlugin } = await import('../src/integration/openclaw-plugin.js');
    const plugin = createOpenClawPlugin({
      brainDir: join(TEST_BRAIN_DIR, 'integration-disabled-whisper'),
      reasoningWhisper: { enabled: false, maxTokens: 120 },
    });

    await plugin.initialize();

    const brainContext = await plugin.onPreResponse({
      sessionId: 'test-session-disabled-whisper',
      message: 'Fix the API endpoint bug',
      senderId: 'user-001',
      senderName: 'TestUser',
      timestamp: new Date().toISOString(),
      channel: 'telegram',
    });

    expect(brainContext).not.toContain('Brain Whisper');

    await plugin.shutdown();
  });

  it('should handle heartbeat without error', async () => {
    const { createOpenClawPlugin } = await import('../src/integration/openclaw-plugin.js');
    const plugin = createOpenClawPlugin({ brainDir: join(TEST_BRAIN_DIR, 'integration4') });

    await plugin.initialize();
    await plugin.onHeartbeat(); // should not throw
    await plugin.shutdown();
  });
});
