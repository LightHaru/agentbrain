import { describe, it, expect } from 'vitest';
import { SourceVerifier } from '../src/core/source-verifier.js';

const v = new SourceVerifier();

describe('SourceVerifier', () => {
  it('requires identity verification for a token query', () => {
    const r = v.advise('Giá token PRL bao nhiêu, contract nào?');
    expect(r.needed).toBe(true);
    expect(r.entityKind).toBe('token');
    expect(r.candidates).toContain('PRL');
    expect(r.directive).toContain('VERIFY-IDENTITY');
    expect(r.directive.toLowerCase()).toContain('contract');
  });

  it('demands multi-source cross-check (site, twitter, news, origin)', () => {
    const r = v.advise('token WPRL có uy tín không, thông tin dự án thế nào?');
    const d = r.directive.toLowerCase();
    expect(d).toContain('website');
    expect(d).toContain('twitter');
    expect(d).toMatch(/bài báo|tin/);
    expect(d).toMatch(/explorer|site gốc|nguồn gốc/);
  });

  it('verifies a project/company identity', () => {
    const r = v.advise('Dự án Pearl là gì, website chính thức nào?');
    expect(r.needed).toBe(true);
    expect(['project', 'token']).toContain(r.entityKind);
  });

  it('verifies a person identity', () => {
    const r = v.advise('Founder của dự án này là ai vậy em?');
    expect(r.needed).toBe(true);
    expect(r.entityKind).toBe('person');
  });

  it('does NOT fire for casual chat', () => {
    expect(v.advise('cảm ơn em nhiều nha').needed).toBe(false);
    expect(v.advise('haha em giỏi thật').needed).toBe(false);
  });

  it('does NOT fire for pure internal recall', () => {
    expect(v.advise('lần trước mình chốt pool nào ấy nhỉ').needed).toBe(false);
  });

  it('warns when no web-search tool is available', () => {
    const r = v.advise('token PRL contract là gì', { hasWebSearch: false });
    expect(r.needed).toBe(true);
    expect(r.directive.toLowerCase()).toContain('chưa xác minh');
  });
});
