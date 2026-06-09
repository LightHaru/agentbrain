"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TheoryOfMind = void 0;
class TheoryOfMind {
    models = new Map();
    topicCounts = new Map();
    predictions = new Map(); // userId -> predicted next sentiment
    hits = 0;
    total = 0;
    current = null;
    perspectiveGaps = 0;
    /** Observe a message from a user; updates model + scores prior prediction. */
    observe(userId, name, sentiment, topic) {
        this.current = userId;
        // score previous prediction for this user
        const predicted = this.predictions.get(userId);
        if (predicted !== undefined) {
            this.total++;
            // hit if predicted sign matches actual sign (or both near-neutral)
            const samesign = (predicted >= 0) === (sentiment >= 0);
            const bothNeutral = Math.abs(predicted) < 0.2 && Math.abs(sentiment) < 0.2;
            if (samesign || bothNeutral)
                this.hits++;
        }
        let m = this.models.get(userId);
        if (!m) {
            m = { userId, name, messageCount: 0, sentimentTrend: 0, topTopics: [], lastSentiment: 0, inferredMood: 'neutral', expectations: [], lastSeen: Date.now() };
            this.models.set(userId, m);
            this.topicCounts.set(userId, new Map());
        }
        m.messageCount++;
        m.name = name || m.name;
        m.sentimentTrend = Number((m.sentimentTrend * 0.7 + sentiment * 0.3).toFixed(3));
        m.lastSentiment = sentiment;
        m.lastSeen = Date.now();
        m.inferredMood = m.sentimentTrend > 0.2 ? 'positive' : m.sentimentTrend < -0.2 ? 'frustrated' : 'neutral';
        if (topic && topic !== 'general') {
            const tc = this.topicCounts.get(userId);
            tc.set(topic, (tc.get(topic) ?? 0) + 1);
            m.topTopics = Array.from(tc.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
        }
        // a sudden sentiment swing = perspective gap (we misread them)
        if (predicted !== undefined && Math.abs(predicted - sentiment) > 0.8)
            this.perspectiveGaps++;
        // predict next: assume mild regression toward their trend
        this.predictions.set(userId, Number((m.sentimentTrend * 0.6 + sentiment * 0.4).toFixed(3)));
    }
    /** Infer an expectation from message phrasing (real, lightweight). */
    noteExpectation(userId, message) {
        const m = this.models.get(userId);
        if (!m)
            return;
        const lower = message.toLowerCase();
        const add = (e) => { if (!m.expectations.includes(e))
            m.expectations.push(e); };
        if (/\b(nhanh|gấp|asap|urgent|ngay)\b/.test(lower))
            add('wants speed');
        if (/\b(chi tiết|đầy đủ|detail|explain|giải thích)\b/.test(lower))
            add('wants detail');
        if (/\b(ngắn|gọn|tóm tắt|brief|short)\b/.test(lower))
            add('wants brevity');
        if (m.expectations.length > 5)
            m.expectations = m.expectations.slice(-5);
    }
    getState() {
        const now = Date.now();
        const active = Array.from(this.models.values()).filter((m) => now - m.lastSeen <= 30 * 60000);
        const current = this.current ? this.models.get(this.current) ?? null : null;
        const accuracy = this.total > 0 ? Number((this.hits / this.total).toFixed(2)) : 0.5;
        const unmet = current ? current.expectations.length : 0;
        return {
            activeUsers: active.length,
            currentUserModel: current,
            predictionAccuracy: accuracy,
            perspectiveGaps: this.perspectiveGaps,
            unmetExpectations: unmet,
        };
    }
}
exports.TheoryOfMind = TheoryOfMind;
//# sourceMappingURL=theory-of-mind.js.map