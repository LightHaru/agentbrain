"use strict";
/**
 * Query Analyzer — Query Understanding for Context-Aware Memory Retrieval
 *
 * Analyzes user queries before memory recall to:
 * - Detect intent (status-check, technical, decision, how-to, general)
 * - Extract entities (projects, files, tech terms, people)
 * - Identify task type (coding, ops, content, crypto, project)
 * - Extract keywords for BM25 boost
 * - Assess complexity for memory budget
 *
 * This enables targeted retrieval instead of blind top-k similarity search.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryAnalyzer = void 0;
class QueryAnalyzer {
    entityPatterns = {
        // Projects/systems
        project: /\b(AgentBrain|Codex|OpenClaw|AiraCM|TinGameFi|Modal|Oracle|Pearl|9router|Krouter)\b/gi,
        // Files/paths
        file: /\b[\w-]+\.(ts|js|json|md|py|yml|yaml|config)\b/gi,
        // Tech terms
        tech: /\b(API|RAG|LLM|memory|graph|vector|embedding|SQL|database|config|plugin|hook|SSH|VPS|GPU|CPU)\b/gi,
        // Crypto terms
        crypto: /\b(PRL|Pearl|token|mining|hashrate|wallet|pool|AlphaPool|airdrop|swap|DeFi)\b/gi,
        // Addresses/IDs
        address: /\b(0x[a-fA-F0-9]{10,}|prl1[a-z0-9]{20,}|[a-z0-9]{40,})\b/gi,
    };
    /**
     * Analyze query and return rich context
     */
    async analyze(query, topic = '') {
        const combined = `${query} ${topic}`.toLowerCase();
        return {
            intent: this.detectIntent(combined),
            entities: this.extractEntities(query),
            taskType: this.detectTaskType(combined),
            keywords: this.extractKeywords(query),
            complexity: this.assessComplexity(query),
            filters: this.buildFilters(combined),
        };
    }
    /**
     * Detect query intent
     */
    detectIntent(query) {
        // Status check — wants current state
        if (/\b(trạng thái|status|tình hình|đang|hiện tại|currently|how's|progress|đến đâu|xong chưa|done\?)\b/i.test(query)) {
            return 'status-check';
        }
        // Decision recall — wants past decisions/outcomes (expanded patterns)
        if (/\b(lần trước|trước đây|đã.*như nào|decided|previous|last time|kết quả|outcome|đã làm gì|đã.*chưa|fix.*(cho|gì|những)|làm.*(cho|gì)|có.*gì|những gì|cho.*gì)\b/i.test(query)) {
            return 'decision-recall';
        }
        // How-to — wants procedure/workflow
        if (/\b(cách|làm sao|how to|bước|step|workflow|quy trình|guide|hướng dẫn|setup|install|deploy)\b/i.test(query)) {
            return 'how-to';
        }
        // Technical question — wants facts/architecture/specs (expanded patterns)
        if (/\b(là gì|what is|hoạt động|work|architecture|implement|code|config|API|database|có.*không|does.*have|support|được chưa|có thể|inject|memory|graph|RAG)\b/i.test(query)) {
            return 'technical-question';
        }
        // Default: general
        return 'general';
    }
    /**
     * Extract named entities from query
     */
    extractEntities(query) {
        const entities = new Set();
        // Extract using patterns
        for (const [category, pattern] of Object.entries(this.entityPatterns)) {
            const matches = query.matchAll(pattern);
            for (const match of matches) {
                entities.add(match[0]);
            }
        }
        // Extract quoted terms (assumed important)
        const quotedMatches = query.matchAll(/"([^"]+)"|'([^']+)'/g);
        for (const match of quotedMatches) {
            entities.add(match[1] || match[2]);
        }
        // Extract capitalized terms (likely proper nouns)
        const capitalizedMatches = query.matchAll(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g);
        for (const match of capitalizedMatches) {
            if (match[0].length > 2) { // skip short words
                entities.add(match[0]);
            }
        }
        return Array.from(entities);
    }
    /**
     * Detect task type for candidate filtering (weighted scoring)
     */
    detectTaskType(query) {
        // Count keyword matches per category
        const scores = {
            crypto: this.countMatches(query, ['crypto', 'token', 'coin', 'defi', 'swap', 'trade', 'contract', 'wallet', 'mining', 'airdrop', 'price', 'PRL', 'pearl']),
            ops: this.countMatches(query, ['server', 'vps', 'nginx', 'docker', 'ssh', 'firewall', 'backup', 'systemd', 'restart', 'monitor', 'tingamefi', 'modal', 'oracle']),
            coding: this.countMatches(query, ['code', 'bug', 'api', 'build', 'test', 'fix', 'implement', 'debug', 'commit', 'push', 'PR', 'merge', 'codex', 'agentbrain', 'openclaw', 'hippocampus']),
            content: this.countMatches(query, ['content', 'blog', 'seo', 'article', 'write', 'post', 'publish', 'keyword', 'traffic', 'GSC']),
            project: this.countMatches(query, ['plan', 'project', 'roadmap', 'milestone', 'sprint', 'deadline', 'task', 'backlog', 'priority']),
        };
        // Find category with highest score
        let maxScore = 0;
        let maxCategory = null;
        for (const [category, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                maxCategory = category;
            }
        }
        return maxScore > 0 ? maxCategory : null;
    }
    /**
     * Count how many keywords from list appear in query
     */
    countMatches(query, keywords) {
        const lower = query.toLowerCase();
        return keywords.filter(kw => {
            const pattern = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'i');
            return pattern.test(lower);
        }).length;
    }
    /**
     * Extract important keywords for BM25 boost
     */
    extractKeywords(query) {
        // Tokenize and filter stopwords
        const stopwords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
            'em', 'sếp', 'anh', 'của', 'và', 'có', 'được', 'là', 'thì', 'cho',
        ]);
        const tokens = query
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter(t => t.length > 2 && !stopwords.has(t));
        // Keep unique, sort by length (longer = more specific)
        return Array.from(new Set(tokens)).sort((a, b) => b.length - a.length);
    }
    /**
     * Assess query complexity to determine memory budget
     */
    assessComplexity(query) {
        const wordCount = query.split(/\s+/).length;
        const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;
        const hasConjunctions = /\b(và|and|hoặc|or|nhưng|but|also|moreover|nên)\b/i.test(query);
        // Override: status-check queries are always simple (regardless of word count)
        if (/\b(trạng thái|status|tình hình|đang|hiện tại)\b/i.test(query)) {
            return 'simple';
        }
        // Override: decision-recall with <=6 words is simple ("Codex fix cho Aira những gì?")
        if (/\b(lần trước|trước đây|đã.*như nào|decided|previous|last time|fix.*(cho|gì))\b/i.test(query) && wordCount <= 6) {
            return 'simple';
        }
        if (wordCount <= 4 && !hasMultipleQuestions) {
            return 'simple'; // e.g., "status mining?"
        }
        if (wordCount > 12 || hasMultipleQuestions || hasConjunctions) {
            return 'complex'; // e.g., "AgentBrain memory inject như nào và đã test chưa?"
        }
        return 'medium';
    }
    /**
     * Build memory filters based on query analysis
     */
    buildFilters(query) {
        const filters = {};
        // Intent-based memory type filtering
        if (/\b(lần trước|đã.*gì|decided|outcome)\b/i.test(query)) {
            filters.memoryTypes = ['episodic']; // only past events
        }
        else if (/\b(cách|how to|workflow|setup)\b/i.test(query)) {
            filters.memoryTypes = ['procedural']; // only procedures
        }
        else if (/\b(là gì|what is|architecture|fact)\b/i.test(query)) {
            filters.memoryTypes = ['semantic']; // only facts
        }
        // Task-type based tag filtering
        const taskType = this.detectTaskType(query);
        if (taskType) {
            filters.tags = [taskType];
        }
        // Confidence threshold for technical/critical queries
        if (/\b(critical|important|production|deploy|config)\b/i.test(query)) {
            filters.minConfidence = 0.7;
        }
        return filters;
    }
    /**
     * Get memory limit based on query intent and complexity
     */
    getMemoryLimit(context) {
        // Status check — keep it brief
        if (context.intent === 'status-check') {
            return 2;
        }
        // Simple query — don't overload
        if (context.complexity === 'simple') {
            return 3;
        }
        // Complex or technical — more context needed
        if (context.complexity === 'complex' || context.intent === 'technical-question') {
            return 7;
        }
        // Default
        return 5;
    }
    /**
     * Format query context for debugging
     */
    formatDebug(context) {
        return [
            `Intent: ${context.intent}`,
            `Entities: ${context.entities.join(', ') || 'none'}`,
            `Task: ${context.taskType || 'general'}`,
            `Complexity: ${context.complexity}`,
            `Keywords: ${context.keywords.slice(0, 5).join(', ')}`,
            `Filters: ${JSON.stringify(context.filters)}`,
        ].join(' | ');
    }
}
exports.QueryAnalyzer = QueryAnalyzer;
//# sourceMappingURL=query-analyzer.js.map