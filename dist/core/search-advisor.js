"use strict";
/**
 * SearchAdvisor — decide when Aira MUST search before answering.
 *
 * The single biggest failure mode of a memory-equipped agent is confident
 * recall of stale or unknown facts. Market memory systems (mem0 temporal
 * reasoning, Graphiti validity windows, Self-RAG "decide-to-retrieve") all
 * converge on the same idea: some questions are time-sensitive or fact-heavy
 * and the model's parametric + remembered knowledge is NOT enough. For those,
 * external retrieval (web search / live tools) is mandatory.
 *
 * This module classifies the query and, when appropriate, emits a directive
 * that is injected into Aira's prompt telling her to search FIRST and cite
 * sources, instead of answering from memory alone.
 *
 * It is deliberately conservative: casual chat, emotional turns, and pure
 * "recall what we decided" questions do NOT trigger a search demand.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchAdvisor = void 0;
class SearchAdvisor {
    // Time-sensitivity: answer changes over time, so memory is likely stale.
    timeSensitive = [
        /(?<![\p{L}\p{N}])(hôm nay|hôm qua|ngày mai|tuần này|tháng này|năm nay|mới nhất|gần đây|hiện tại|bây giờ|đang|vừa|sắp)(?![\p{L}\p{N}])/iu,
        /(?<![\p{L}\p{N}])(today|yesterday|tomorrow|this week|this month|latest|recent|recently|current|currently|right now|as of)(?![\p{L}\p{N}])/iu,
        /(?<![\p{L}\p{N}])(202[4-9]|20[3-9]\d)(?![\p{L}\p{N}])/u, // explicit recent/future years
    ];
    // Live/volatile facts: prices, markets, weather, status of external systems.
    volatile = [
        /(?<![\p{L}\p{N}])(giá|price|tỷ giá|rate|market cap|marketcap|vốn hóa|volume|thanh khoản|liquidity|apr|apy|lãi suất|floor price)(?![\p{L}\p{N}])/iu,
        /(?<![\p{L}\p{N}])(tin tức|news|thông báo|announcement|update|cập nhật|sự kiện|event|airdrop|listing|niêm yết)(?![\p{L}\p{N}])/iu,
        /(?<![\p{L}\p{N}])(thời tiết|weather|tỉ số|score|kết quả trận|election|bầu cử)(?![\p{L}\p{N}])/iu,
        /(?<![\p{L}\p{N}])(phiên bản|version|release|changelog|latest version|bản mới)(?![\p{L}\p{N}])/iu,
    ];
    // Explicit user demand to look it up.
    explicit = [
        /(?<![\p{L}\p{N}])(search|google|tra cứu|tìm kiếm|tìm hiểu|check giúp|kiểm tra giúp|look up|find out|verify|xác minh|đối chiếu|nguồn|source|dẫn nguồn|cite)(?![\p{L}\p{N}])/iu,
    ];
    // Factual "what/who/when/how much" questions about the external world.
    externalFactual = [
        /(?<![\p{L}\p{N}])(là ai|là gì|bao nhiêu|khi nào|ở đâu|thế nào)(?![\p{L}\p{N}])/iu,
        /(?<![\p{L}\p{N}])(who is|what is|what are|how much|how many|when did|when is|where is|which)(?![\p{L}\p{N}])/iu,
    ];
    // Pure internal-recall / chit-chat / action turns that should NOT force search.
    internalOnly = [
        /(?<![\p{L}\p{N}])(lần trước|trước đây|đã chốt|đã quyết|mình đã|chúng ta đã|em nhớ|anh nhớ|nhắc lại|recall|remember when|we decided|last time)(?![\p{L}\p{N}])/iu,
        /(?<![\p{L}\p{N}])(cảm ơn|thanks|thank you|ok|oke|okay|ừ|uh|hi|hello|chào|haha|hehe|😂|❤️)(?![\p{L}\p{N}])/iu,
    ];
    /**
     * Analyze a user message and decide whether Aira should search first.
     * @param message the raw user message
     * @param opts.hasWebSearch whether a web-search tool is actually available
     */
    advise(message, opts = {}) {
        const text = (message || '').trim();
        const none = { urgency: 'none', reasons: [], directive: '', suggestedTools: [] };
        if (text.length < 3)
            return none;
        const signals = [];
        const isQuestion = /\?|(?<![\p{L}\p{N}])(là ai|là gì|bao nhiêu|khi nào|ở đâu|thế nào|who|what|when|where|which|how)(?![\p{L}\p{N}])/iu.test(text);
        if (this.any(this.explicit, text))
            signals.push({ reason: 'user explicitly asked to look it up / cite a source', weight: 1.0 });
        if (this.any(this.volatile, text))
            signals.push({ reason: 'volatile/live fact (price, news, version, market) that memory cannot be trusted for', weight: 0.8 });
        if (this.any(this.timeSensitive, text))
            signals.push({ reason: 'time-sensitive phrasing (latest/current/recent/date) — remembered data may be stale', weight: 0.6 });
        if (isQuestion && this.any(this.externalFactual, text))
            signals.push({ reason: 'factual question about the external world', weight: 0.4 });
        // Strong suppressor: pure internal-recall or social chatter.
        const internal = this.any(this.internalOnly, text) && !this.any(this.explicit, text) && !this.any(this.volatile, text);
        const score = signals.reduce((s, x) => s + x.weight, 0);
        let urgency = 'none';
        if (!internal) {
            if (score >= 0.8)
                urgency = 'required';
            else if (score >= 0.4)
                urgency = 'recommended';
        }
        if (urgency === 'none')
            return none;
        const suggestedTools = opts.hasWebSearch === false
            ? ['(no web-search tool detected — state that you could not verify live)']
            : ['brave/web_search', 'duckduckgo', 'browser'];
        const reasons = signals.map(s => s.reason);
        const directive = this.formatDirective(urgency, reasons, suggestedTools, opts.hasWebSearch !== false);
        return { urgency, reasons, directive, suggestedTools };
    }
    formatDirective(urgency, reasons, tools, hasTool) {
        const head = urgency === 'required'
            ? '🔎 SEARCH-FIRST (bắt buộc): câu này cần bằng chứng NGOÀI trí nhớ.'
            : '🔎 Search-first (nên làm): kiểm chứng bằng nguồn trước khi khẳng định.';
        const lines = [head];
        lines.push(`Lý do: ${reasons.slice(0, 2).join('; ')}.`);
        if (hasTool) {
            lines.push(`Trước khi trả lời: search web (${tools[0]}), đọc nguồn, rồi trả lời + dẫn nguồn. KHÔNG đoán từ trí nhớ với dữ liệu có thể cũ.`);
        }
        else {
            lines.push('Không có tool search — nói rõ là chưa xác minh được dữ liệu live, đừng khẳng định chắc chắn.');
        }
        return lines.join('\n');
    }
    any(patterns, text) {
        return patterns.some(p => p.test(text));
    }
}
exports.SearchAdvisor = SearchAdvisor;
//# sourceMappingURL=search-advisor.js.map