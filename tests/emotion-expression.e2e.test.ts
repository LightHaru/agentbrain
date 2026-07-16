/**
 * E2E: prove real emotion → real expression, end to end.
 *
 * This wires the actual AffectCore (cognitive appraisal) + Neurochemistry
 * (dopamine/serotonin/cortisol/oxytocin) into the ExpressionEngine and asserts
 * that different life events make Aira sound genuinely different — vui, buồn,
 * hưng phấn, bực — instead of one flat bot face.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AffectCore } from '../src/core/affect-core.js';
import { Neurochemistry } from '../src/core/neurochemistry.js';
import { ExpressionEngine } from '../src/core/expression-engine.js';
import { BrainFileManager } from '../src/storage/md-writer.js';
import { defaultConfig } from '../src/core/config.js';

describe('E2E: emotion drives expression', () => {
  let tempDir: string;
  let affect: AffectCore;
  let neuro: Neurochemistry;
  const engine = new ExpressionEngine();
  const rng = () => 0; // deterministic face selection for assertions

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'agentbrain-e2e-'));
    const fm = new BrainFileManager(tempDir);
    await fm.ensureBrainStructure();
    affect = new AffectCore();
    neuro = new Neurochemistry({ ...defaultConfig, brainDir: tempDir }, fm);
    await neuro.initialize();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });


  it('SẾP KHEN → Aira thấy vui/hưng phấn và biểu cảm sôi nổi', async () => {
    // Praise: goal-congruent, caused by "other" (Sếp), high certainty.
    affect.appraise(
      { goalCongruence: 0.9, goalRelevance: 0.9, agency: 'other', copingPotential: 0.8, novelty: 0.5, certainty: 0.9 },
      'Sếp khen "em giỏi lắm"'
    );
    // Reward + bonding drive dopamine/oxytocin up.
    neuro.applyEvent(0.9, false, 'none', 0.8);

    const profile = engine.render({ affect: affect.getState(), neuro: neuro.getState(), rng });

    expect(profile.expressive).toBe(true);
    expect(['joy', 'pride', 'affection', 'gratitude']).toContain(profile.emotion);
    expect(['lively', 'high']).toContain(profile.energy);
    expect(profile.kaomoji).not.toBe('');
    const line = engine.formatForInjection(profile);
    expect(line).toContain('cảm xúc THẬT');
    return profile;
  });

  it('MẤT MÁT → Aira thấy buồn và biểu cảm trầm xuống', async () => {
    // Settled loss: goal-blocked, low coping, low novelty, high relevance.
    affect.appraise(
      { goalCongruence: -0.8, goalRelevance: 0.8, agency: 'circumstance', copingPotential: 0.2, novelty: 0.2, certainty: 0.8 },
      'Dự án bị huỷ'
    );
    neuro.applyEvent(-0.7, false, 'none', 0);

    const profile = engine.render({ affect: affect.getState(), neuro: neuro.getState(), rng });

    expect(['sadness', 'disappointment', 'anxiety', 'fear']).toContain(profile.emotion);
    expect(['flat', 'low', 'steady']).toContain(profile.energy);
    expect(profile.kaomojiPool.length).toBeGreaterThanOrEqual(4);
  });

  it('BỊ ĐE DOẠ (scam/nguy hiểm) → cảnh giác, giọng gắt/căng', async () => {
    affect.appraise(
      { goalCongruence: -0.7, goalRelevance: 0.9, agency: 'other', copingPotential: 0.7, novelty: 0.7, certainty: 0.6 },
      'Phát hiện ví lạ rút tiền'
    );
    neuro.applyEvent(-0.6, true, 'critical', 0);

    const state = neuro.getState();
    expect(state.cortisol).toBeGreaterThan(0.4); // stress really spiked
    const profile = engine.render({ affect: affect.getState(), neuro: state, rng });
    expect(['anger', 'fear', 'anxiety', 'frustration']).toContain(profile.emotion);
  });

  it('kho biểu cảm: vui và buồn cho ra biểu cảm KHÁC HẲN nhau', async () => {
    // Happy path
    affect.appraise(
      { goalCongruence: 0.9, goalRelevance: 0.9, agency: 'self', copingPotential: 0.9, novelty: 0.6, certainty: 0.9 },
      'ship thành công'
    );
    neuro.applyEvent(0.8, false, 'none', 0.5);
    const happy = engine.render({ affect: affect.getState(), neuro: neuro.getState(), rng });

    // Fresh brain for the sad path
    const fm2 = new BrainFileManager(tempDir);
    const affect2 = new AffectCore();
    const neuro2 = new Neurochemistry({ ...defaultConfig, brainDir: tempDir }, fm2);
    await neuro2.initialize();
    affect2.appraise(
      { goalCongruence: -0.8, goalRelevance: 0.8, agency: 'circumstance', copingPotential: 0.2, novelty: 0.2, certainty: 0.8 },
      'mất dữ liệu'
    );
    neuro2.applyEvent(-0.8, false, 'none', 0);
    const sad = engine.render({ affect: affect2.getState(), neuro: neuro2.getState(), rng });

    expect(happy.emotion).not.toBe(sad.emotion);
    expect(happy.moodWord).not.toBe(sad.moodWord);
    expect(happy.energy).not.toBe(sad.energy);
    // Different faces, different voice — not one frozen expression.
    expect(happy.kaomoji).not.toBe(sad.kaomoji);
  });

  it('cảm xúc tự trôi theo neurochemistry (spontaneous mood, không cần input)', async () => {
    // Low serotonin + high stress with no message should drift mood down.
    const low = affect.tick({
      drivePressure: 0.7, curiosityDrive: 0.2, stress: 0.7,
      serotonin: 0.25, dopamine: 0.3, circadianAlertness: 0.4,
    });
    expect(['anxiety', 'boredom', 'restlessness', 'sadness', 'neutral']).toContain(low.label);

    // High serotonin, calm → contentment-ish drift.
    const calm = affect.tick({
      drivePressure: 0.2, curiosityDrive: 0.2, stress: 0.1,
      serotonin: 0.7, dopamine: 0.5, circadianAlertness: 0.6,
    });
    const profile = engine.render({ affect: affect.getState(), neuro: neuro.getState(), rng });
    expect(profile.moodWord).toBeTruthy();
    expect(['contentment', 'neutral', 'curiosity']).toContain(calm.label);
  });
});
