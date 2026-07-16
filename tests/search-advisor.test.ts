import { describe, it, expect } from 'vitest';
import { SearchAdvisor } from '../src/core/search-advisor.js';

const advisor = new SearchAdvisor();

describe('SearchAdvisor', () => {
  it('requires search for volatile price queries', () => {
    const a = advisor.advise('Giá PRL hôm nay bao nhiêu rồi em?');
    expect(a.urgency).toBe('required');
    expect(a.directive).toContain('SEARCH-FIRST');
  });

  it('requires search when user explicitly asks to look it up', () => {
    const a = advisor.advise('search giúp anh tin tức mới nhất về Arbitrum');
    expect(a.urgency).toBe('required');
  });

  it('recommends search for external factual questions', () => {
    const a = advisor.advise('CEO của OpenAI hiện tại là ai?');
    expect(['recommended', 'required']).toContain(a.urgency);
  });

  it('does NOT force search for pure internal recall', () => {
    const a = advisor.advise('Lần trước mình đã chốt dùng pool nào ấy nhỉ?');
    expect(a.urgency).toBe('none');
  });

  it('does NOT force search for casual chat', () => {
    const a = advisor.advise('cảm ơn em nhiều nha, giỏi lắm');
    expect(a.urgency).toBe('none');
  });

  it('warns when no web-search tool is available', () => {
    const a = advisor.advise('giá bitcoin bây giờ', { hasWebSearch: false });
    expect(a.urgency).toBe('required');
    expect(a.directive.toLowerCase()).toContain('chưa xác minh');
  });
});
