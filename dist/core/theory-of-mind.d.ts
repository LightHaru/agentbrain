/**
 * Theory of Mind — per-user mental model
 *
 * REAL state: builds a model per senderId from observed messages (sentiment
 * trend, recurring topics, inferred expectations), predicts the next-message
 * sentiment, and scores prediction accuracy against what actually arrives.
 * Nothing is hardcoded — activeUsers reflects real distinct senders.
 */
export interface UserModel {
    userId: string;
    name: string;
    messageCount: number;
    sentimentTrend: number;
    topTopics: string[];
    lastSentiment: number;
    inferredMood: 'positive' | 'neutral' | 'frustrated';
    expectations: string[];
    lastSeen: number;
}
export interface TheoryOfMindState {
    activeUsers: number;
    currentUserModel: UserModel | null;
    predictionAccuracy: number;
    perspectiveGaps: number;
    unmetExpectations: number;
}
export declare class TheoryOfMind {
    private models;
    private topicCounts;
    private predictions;
    private hits;
    private total;
    private current;
    private perspectiveGaps;
    /** Observe a message from a user; updates model + scores prior prediction. */
    observe(userId: string, name: string, sentiment: number, topic: string): void;
    /** Infer an expectation from message phrasing (real, lightweight). */
    noteExpectation(userId: string, message: string): void;
    getState(): TheoryOfMindState;
}
//# sourceMappingURL=theory-of-mind.d.ts.map