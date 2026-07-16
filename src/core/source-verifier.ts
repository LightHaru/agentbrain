/**
 * SourceVerifier — force identity + multi-source verification before Aira
 * quotes facts about a named entity (token, project, company, person).
 *
 * The failure this fixes: for an ambiguous name (e.g. several tokens all called
 * "PRL"), Aira grabbed the FIRST search hit and quoted the WRONG project. A
 * name/ticker match is not identity. Real analysts confirm identity by
 * corroborating across independent sources and matching a canonical identifier
 * (contract address + chain, official domain, verified handle).
 *
 * This module detects when a query targets a named/ambiguous entity and injects
 * a verification protocol telling Aira to:
 *   1. pin the canonical identifier (contract+chain / official domain / handle);
 *   2. corroborate across the official site, the project's X/Twitter, reputable
 *      news, and the canonical registry/explorer — not one source;
 *   3. reject name-only matches and flag ticker collisions explicitly;
 *   4. only quote data whose source row matches the confirmed identity.
 *
 * It is language-aware (Vietnamese + English) and conservative: it does not
 * fire for casual chat or pure internal recall.
 */

export type EntityKind = 'token' | 'project' | 'person' | 'company' | 'generic';

export interface VerifyAdvice {
  needed: boolean;
  entityKind: EntityKind;
  /** Candidate entity names/tickers detected in the query. */
  candidates: string[];
  /** Injectable verification protocol, or '' when not needed. */
  directive: string;
}

// Crypto/token cues — highest risk of ticker collisions.
const TOKEN_CUES = /(token|coin|\$[A-Z]{2,6}\b|ticker|contract|CA\b|on-chain|onchain|dex|cex|airdrop|listing|niêm yết|hợp đồng|mã thông báo|đồng coin)/i;
// General "who/what is this named thing" cues.
const ENTITY_CUES = /(dự án|project|công ty|company|founder|nhà sáng lập|team|đội ngũ|website|trang chủ|twitter|x\.com|whitepaper|tin tức|news|bài báo|thông tin về|là gì|là ai|uy tín|scam|lừa đảo|có thật)/i;

// A short uppercase ticker like PRL, WPRL, BTC, or a $-prefixed symbol.
const TICKER = /\$?[A-Z][A-Z0-9]{1,6}\b/g;
// Proper-noun-ish capitalized names.
const PROPER = /\b[A-Z][a-zA-Z0-9]+(?:[A-Z][a-zA-Z0-9]+)*\b/g;

// Suppressors: pure recall / social chatter.
const INTERNAL = /(lần trước|trước đây|đã chốt|mình đã|em nhớ|nhắc lại|cảm ơn|thanks|haha|hihi|chào)/i;

export class SourceVerifier {
  /**
   * Decide whether the query needs source-identity verification.
   * @param message raw user message
   * @param opts.hasWebSearch whether live search tools exist
   */
  advise(message: string, opts: { hasWebSearch?: boolean } = {}): VerifyAdvice {
    const text = (message || '').trim();
    const none: VerifyAdvice = { needed: false, entityKind: 'generic', candidates: [], directive: '' };
    if (text.length < 3) return none;
    if (INTERNAL.test(text) && !TOKEN_CUES.test(text)) return none;

    const isToken = TOKEN_CUES.test(text);
    const isEntity = ENTITY_CUES.test(text);
    if (!isToken && !isEntity) return none;

    const entityKind: EntityKind = isToken ? 'token'
      : /founder|nhà sáng lập|là ai|who is/i.test(text) ? 'person'
      : /công ty|company/i.test(text) ? 'company'
      : 'project';

    const candidates = this.extractCandidates(text, entityKind);
    const directive = this.buildDirective(entityKind, candidates, opts.hasWebSearch !== false);
    return { needed: true, entityKind, candidates, directive };
  }

  private extractCandidates(text: string, kind: EntityKind): string[] {
    const out = new Set<string>();
    if (kind === 'token') {
      for (const m of text.matchAll(TICKER)) {
        const t = m[0].replace('$', '');
        // Skip common non-ticker uppercase words.
        if (!/^(THE|AND|FOR|USD|USDT|API|CEO|NFT|DEX|CEX|CA)$/.test(t)) out.add(t);
      }
    }
    for (const m of text.matchAll(PROPER)) {
      if (m[0].length > 2) out.add(m[0]);
    }
    return Array.from(out).slice(0, 6);
  }

  private buildDirective(kind: EntityKind, candidates: string[], hasTool: boolean): string {
    const who = candidates.length ? candidates.join(', ') : '(chưa rõ)';
    const lines: string[] = [];
    lines.push('🔗 VERIFY-IDENTITY (bắt buộc): xác minh ĐÚNG đối tượng trước khi trích số liệu/tin.');
    lines.push(`Ứng viên phát hiện: ${who}. Trùng tên/ticker KHÔNG có nghĩa là đúng — phải xác minh danh tính.`);

    if (kind === 'token') {
      lines.push('Bước xác minh token:');
      lines.push('  1. Chốt định danh chuẩn: contract address + chain (vd 0x... trên ETH/BSC/Solana), không chỉ ticker.');
      lines.push('  2. Đối chiếu ĐỦ nguồn, phải khớp nhau: website chính thức → X/Twitter chính chủ (verified) → bài báo/tin uy tín → site gốc/explorer (Etherscan/Solscan) hoặc CoinGecko/CoinMarketCap trang dự án.');
      lines.push('  3. Nếu có nhiều token trùng tên/ticker: LIỆT KÊ từng ứng viên (tên đầy đủ + chain + contract) và hỏi Sếp token nào, đừng tự chọn.');
      lines.push('  4. Chỉ trích giá/volume/mcap từ đúng dòng nguồn khớp contract đã xác minh — không trộn số liệu giữa các token cùng tên.');
    } else if (kind === 'person') {
      lines.push('Bước xác minh người: đối chiếu website/hồ sơ chính thức + tài khoản X/LinkedIn verified + bài báo uy tín; phân biệt người trùng tên; nêu rõ nếu không chắc.');
    } else {
      lines.push('Bước xác minh dự án/công ty:');
      lines.push('  1. Xác định domain chính thức + tài khoản X/Twitter chính chủ (verified).');
      lines.push('  2. Đối chiếu chéo: website → X/Twitter → bài báo/tin tức → nguồn gốc (đăng ký/whitepaper/repo).');
      lines.push('  3. Cảnh giác trang giả mạo/typosquat; ưu tiên nguồn gốc, ghi rõ ngày.');
    }

    if (!hasTool) {
      lines.push('Không có tool search — nói rõ chưa xác minh được danh tính, tuyệt đối không khẳng định.');
    } else {
      lines.push('Nếu nguồn mâu thuẫn hoặc không đủ để chốt danh tính: nói rõ điều chưa chắc thay vì đoán.');
    }
    return lines.join('\n');
  }
}
