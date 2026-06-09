"use strict";
/**
 * Feedback Analyzer — Learn from User Reactions
 *
 * Phase 5: Detect user satisfaction from:
 * - Reaction timing (quick reply = interested, delayed = neutral/busy)
 * - Sentiment (praise, correction, frustration)
 * - Behavioral patterns (repeated questions = agent failed)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackAnalyzer = void 0;
class FeedbackAnalyzer {
    lastAgentReplyTime = null;
    /**
     * Record agent reply timestamp for timing measurement
     */
    recordAgentReply() {
        this.lastAgentReplyTime = Date.now();
    }
    /**
     * Analyze user message as feedback signal
     */
    analyze(message, userReplyTime) {
        const reactionTimeMs = this.lastAgentReplyTime
            ? userReplyTime - this.lastAgentReplyTime
            : null;
        const sentiment = this.detectSentiment(message);
        const markers = this.detectMarkers(message);
        const confidence = this.calculateConfidence(sentiment, markers, reactionTimeMs);
        // Reset timer
        this.lastAgentReplyTime = null;
        return {
            timestamp: new Date(userReplyTime).toISOString(),
            reactionTimeMs,
            sentiment,
            markers,
            confidence,
        };
    }
    /**
     * Detect sentiment from explicit feedback
     */
    detectSentiment(msg) {
        const lower = msg.toLowerCase();
        // Explicit positive
        if (/\b(hay|tốt|đúng rồi|ok|ổn|ngon|cảm ơn|thanks|good|nice|great|👍|❤️|✅)\b/i.test(lower)) {
            return 'positive';
        }
        // Explicit negative (correction, frustration)
        if (/\b(sai|tệ|dở|lỗi|không đúng|fail|wrong|chậm quá|dài dòng|vô lý|wtf|💢|😤)\b/i.test(lower)) {
            return 'negative';
        }
        // Repeated question pattern (implicit negative)
        if (/\b(lại|nữa|còn|vẫn chưa|hỏi lại)\b/i.test(lower)) {
            return 'negative';
        }
        return 'neutral';
    }
    /**
     * Extract specific feedback markers
     */
    detectMarkers(msg) {
        const markers = [];
        const lower = msg.toLowerCase();
        if (/dài dòng|verbose|quá dài/i.test(lower))
            markers.push('too_verbose');
        if (/ngắn quá|thiếu|chưa đủ/i.test(lower))
            markers.push('too_brief');
        if (/không hiểu|confusing|rối/i.test(lower))
            markers.push('unclear');
        if (/chậm|lâu quá|delay/i.test(lower))
            markers.push('slow');
        if (/hay|đúng|tốt|ok|ổn/i.test(lower))
            markers.push('good');
        if (/sai|lỗi|fail/i.test(lower))
            markers.push('error');
        return markers;
    }
    /**
     * Calculate confidence of feedback signal
     */
    calculateConfidence(sentiment, markers, reactionTimeMs) {
        let confidence = 0.5;
        // Explicit markers boost confidence
        if (markers.length > 0)
            confidence += 0.3;
        // Quick reaction (<30s) + positive = high confidence positive
        if (reactionTimeMs && reactionTimeMs < 30000 && sentiment === 'positive') {
            confidence += 0.2;
        }
        // Slow reaction (>5min) reduces confidence (user may be busy)
        if (reactionTimeMs && reactionTimeMs > 300000) {
            confidence -= 0.2;
        }
        return Math.max(0, Math.min(1, confidence));
    }
    /**
     * Convert feedback to reward signal (-1 to 1)
     */
    toRewardSignal(feedback) {
        let reward = 0;
        // Sentiment baseline
        if (feedback.sentiment === 'positive')
            reward += 0.6;
        if (feedback.sentiment === 'negative')
            reward -= 0.6;
        // Reaction timing modifier
        if (feedback.reactionTimeMs) {
            if (feedback.reactionTimeMs < 30000)
                reward += 0.2; // quick = engaged
            if (feedback.reactionTimeMs > 300000)
                reward -= 0.1; // slow = maybe disinterested
        }
        // Marker-specific adjustments
        if (feedback.markers.includes('too_verbose'))
            reward -= 0.3;
        if (feedback.markers.includes('unclear'))
            reward -= 0.4;
        if (feedback.markers.includes('good'))
            reward += 0.4;
        // Weight by confidence
        return Math.max(-1, Math.min(1, reward * feedback.confidence));
    }
}
exports.FeedbackAnalyzer = FeedbackAnalyzer;
//# sourceMappingURL=feedback-analyzer.js.map