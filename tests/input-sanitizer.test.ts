import { describe, it, expect } from 'vitest';
import { sanitizeUserMessage, redactSecrets } from '../src/core/input-sanitizer.js';

describe('sanitizeUserMessage', () => {
  it('strips AgentBrain injected Brain State block', () => {
    const raw = 'Giá PRL hôm nay bao nhiêu?\n\n## Brain State (AgentBrain — auto-injected)\n🔎 SEARCH-FIRST\nMood: neutral';
    const r = sanitizeUserMessage(raw);
    expect(r.clean).toBe('Giá PRL hôm nay bao nhiêu?');
    expect(r.strippedInjection).toBe(true);
    expect(r.clean).not.toContain('SEARCH-FIRST');
  });

  it('strips the retry system prefix', () => {
    const raw = '[Retry after the previous model attempt failed or timed out]\n\nEm ơi làm giúp anh';
    const r = sanitizeUserMessage(raw);
    expect(r.clean).toBe('Em ơi làm giúp anh');
    expect(r.strippedInjection).toBe(true);
  });

  it('strips the Brain Whisper section', () => {
    const raw = 'Câu hỏi thật\n\n### Brain Whisper (Private support for Aira)\nRole: ...';
    const r = sanitizeUserMessage(raw);
    expect(r.clean).toBe('Câu hỏi thật');
  });

  it('unwraps the OpenClaw runtime envelope and extracts the current message', () => {
    const raw = [
      'Sender (untrusted metadata):',
      '```json',
      '{}',
      '```',
      '',
      'Conversation context (untrusted, chronological, selected for current message):',
      '#49794 Mon 2026-07-13 00:41:57 GMT+7 KL: Ơ vậy em cũng làm đc mà',
      '#session:ee2d5c0c Mon 2026-07-13 00:41:59 GMT+7 OpenClaw: Haha đúng rồi Sếp',
      '',
      'Cho Agent tự tạo hình thì sao em anh muốn làm dạng anime',
    ].join('\n');
    const r = sanitizeUserMessage(raw);
    expect(r.clean).toBe('Cho Agent tự tạo hình thì sao em anh muốn làm dạng anime');
    expect(r.clean).not.toContain('OpenClaw:');
    expect(r.clean).not.toContain('untrusted');
    expect(r.strippedInjection).toBe(true);
  });

  it('handles a bare metadata envelope with no history lines', () => {
    const raw = 'Sender (untrusted metadata):\n```json\n{"chat_id":"telegram:123"}\n```\nchào em nhé';
    const r = sanitizeUserMessage(raw);
    expect(r.clean.toLowerCase()).toContain('chào em');
    expect(r.clean).not.toContain('chat_id');
  });

  // Synthetic (fake) credentials, assembled at runtime so GitHub secret
  // scanning does not flag these test fixtures as real leaked keys. The
  // sanitizer sees the same concatenated strings a real message would carry.
  const FAKE_AKID = 'AKIA' + 'VAQSWNWCXTZ4I4KN';
  const FAKE_SECRET_1 = 'ybhxCAaYPE1MiD2uBJwO6' + 'EzPZxYV9M2hSGJNamcU';
  const FAKE_SECRET_2 = 'TDEJgIeYMEjmSLgj8OleoC3xDI0' + '/MhpyAAGi0V5w';

  it('redacts AWS credentials', () => {
    const raw = `Access key:${FAKE_AKID}\nSecret access key: ${FAKE_SECRET_1}`;
    const r = sanitizeUserMessage(raw);
    expect(r.redactedSecret).toBe(true);
    expect(r.clean).not.toContain(FAKE_AKID);
    expect(r.clean).not.toContain(FAKE_SECRET_1);
  });

  it('redacts an AWS secret key that sits on the next line', () => {
    const raw = `Access key\n${FAKE_AKID}\n\nSecret access key\n${FAKE_SECRET_2}`;
    const r = sanitizeUserMessage(raw);
    expect(r.redactedSecret).toBe(true);
    expect(r.clean).not.toContain(FAKE_SECRET_2);
    expect(r.clean).not.toContain(FAKE_AKID);
  });

  it('redacts an OpenAI-style key and JWT', () => {
    const raw = 'token sk-abcdefghijklmnopqrstuvwx và jwt eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const r = sanitizeUserMessage(raw);
    expect(r.clean).toContain('[REDACTED_API_KEY]');
    expect(r.clean).toContain('[REDACTED_JWT]');
  });

  it('leaves a clean message untouched', () => {
    const raw = 'anh mining bằng pool AlphaPool nhé';
    const r = sanitizeUserMessage(raw);
    expect(r.clean).toBe(raw);
    expect(r.strippedInjection).toBe(false);
    expect(r.redactedSecret).toBe(false);
  });
});

describe('redactSecrets', () => {
  it('redacts secrets but keeps markdown headers intact', () => {
    const akid = 'AKIA' + 'VAQSWNWCXTZ4I4KN';
    const raw = `## Kết quả\nGiá: $0.17\nkey ${akid}`;
    const r = redactSecrets(raw);
    expect(r.clean).toContain('## Kết quả');
    expect(r.clean).toContain('$0.17');
    expect(r.clean).not.toContain(akid);
    expect(r.redactedSecret).toBe(true);
  });
});
