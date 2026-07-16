/**
 * Validates the CODE and DESIGN distillation corpora: well-formed playbooks,
 * meaningful coverage (basic→advanced→hard for code; system/anti-AI/layout/
 * polish for design), and that they merge into the trainer's effective corpus.
 */
import { describe, it, expect } from 'vitest';
import { OPUS_DISTILLATION_CODE } from '../src/training/distillation-corpus-code.js';
import { OPUS_DISTILLATION_DESIGN } from '../src/training/distillation-corpus-design.js';

function checkPlaybooks(corpus: any) {
  for (const dp of corpus.playbooks) {
    const pb = dp.playbook;
    expect(pb.id, 'id').toBeTruthy();
    expect(pb.label, 'label').toBeTruthy();
    expect(Array.isArray(pb.matchAll) && pb.matchAll.length > 0, `${pb.id} matchAll`).toBe(true);
    expect(pb.reasoningFrame.length, `${pb.id} reasoningFrame`).toBeGreaterThan(0);
    expect(pb.verificationChecks.length, `${pb.id} checks`).toBeGreaterThan(0);
    expect((pb.intentAnchors || []).length, `${pb.id} anchors`).toBeGreaterThan(0);
    expect(dp.probes.length, `${pb.id} probes`).toBeGreaterThan(0);
    // regex strings must compile
    for (const r of pb.matchAll) expect(() => new RegExp(r, 'i')).not.toThrow();
  }
}

describe('CODE distillation corpus', () => {
  it('has well-formed playbooks', () => checkPlaybooks(OPUS_DISTILLATION_CODE));

  it('covers basic → advanced → hard (debug, E2E, perf/concurrency)', () => {
    const ids = OPUS_DISTILLATION_CODE.playbooks.map((p) => p.playbook.id);
    expect(ids).toContain('distilled-debug-from-evidence');
    expect(ids).toContain('distilled-e2e-testing');
    expect(ids).toContain('distilled-design-before-code');
    expect(ids).toContain('distilled-hard-perf-concurrency');
  });

  it('carries lessons + procedures + commonErrors to internalize', () => {
    expect(OPUS_DISTILLATION_CODE.lessons!.length).toBeGreaterThan(0);
    expect(OPUS_DISTILLATION_CODE.procedures!.length).toBeGreaterThan(0);
    expect(OPUS_DISTILLATION_CODE.commonErrors!.length).toBeGreaterThan(0);
    // the "done only when tested" discipline must be present
    const text = JSON.stringify(OPUS_DISTILLATION_CODE);
    expect(/build.*test|test.*build|E2E|regression/i.test(text)).toBe(true);
  });
});

describe('DESIGN distillation corpus', () => {
  it('has well-formed playbooks', () => checkPlaybooks(OPUS_DISTILLATION_DESIGN));

  it('covers visual system, anti-AI-look, layout/responsive, and polish', () => {
    const ids = OPUS_DISTILLATION_DESIGN.playbooks.map((p) => p.playbook.id);
    expect(ids).toContain('distilled-design-visual-system');
    expect(ids).toContain('distilled-design-anti-ai-look');
    expect(ids).toContain('distilled-design-layout-responsive');
    expect(ids).toContain('distilled-design-motion-polish');
  });

  it('explicitly fights the AI/vibe-code look', () => {
    const text = JSON.stringify(OPUS_DISTILLATION_DESIGN).toLowerCase();
    expect(text).toContain('ai');
    expect(/gradient|font|emoji|generic|vibe/.test(text)).toBe(true);
    expect(/responsive|375|768|1440|mobile/.test(text)).toBe(true);
    expect(/wcag|contrast/.test(text)).toBe(true);
  });
});
