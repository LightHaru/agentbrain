/**
 * Feedback Analyzer — Learn from User Reactions
 *
 * Phase 5: Detect user satisfaction from:
 * - Reaction timing (quick reply = interested, delayed = neutral/busy)
 * - Sentiment (praise, correction, frustration)
 * - Behavioral patterns (repeated questions = agent failed)
 */
export interface FeedbackSignal {
    timestamp: string;
    reactionTimeMs: number | null;
    sentiment: 'positive' | 'neutral' | 'negative';
    markers: string[];
    confidence: number;
}
export declare class FeedbackAnalyzer {
    private lastAgentReplyTime;
    /**
     * Record agent reply timestamp for timing measurement
     */
    recordAgentReply(): void;
    /**
     * Analyze user message as feedback signal
     */
    analyze(message: string, userReplyTime: number): FeedbackSignal;
    /**
     * Detect sentiment from explicit feedback
     */
    private detectSentiment;
    /**
     * Extract specific feedback markers
     */
    private detectMarkers;
    /**
     * Calculate confidence of feedback signal
     */
    private calculateConfidence;
    /**
     * Convert feedback to reward signal (-1 to 1)
     */
    toRewardSignal(feedback: FeedbackSignal): number;
}
//# sourceMappingURL=feedback-analyzer.d.ts.map