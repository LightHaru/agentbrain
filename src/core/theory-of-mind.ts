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
  sentimentTrend: number; // running avg, -1..1
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

export class TheoryOfMind {
  private models = new Map<string, UserModel>();
  private topicCounts = new Map<string, Map<string, number>>();
  private predictions = new Map<string, number>(); // userId -> predicted next sentiment
  private hits = 0;
  private total = 0;
  private current: string | null = null;
  private perspectiveGaps = 0;

  /** Observe a message from a user; updates model + scores prior prediction. */
  observe(userId: string, name: string, sentiment: number, topic: string): void {
    this.current = userId;

    // score previous prediction for this user
    const predicted = this.predictions.get(userId);
    if (predicted !== undefined) {
      this.total++;
      // hit if predicted sign matches actual sign (or both near-neutral)
      const samesign = (predicted >= 0) === (sentiment >= 0);
      const bothNeutral = Math.abs(predicted) < 0.2 && Math.abs(sentiment) < 0.2;
      if (samesign || bothNeutral) this.hits++;
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
      const tc = this.topicCounts.get(userId)!;
      tc.set(topic, (tc.get(topic) ?? 0) + 1);
      m.topTopics = Array.from(tc.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
    }

    // a sudden sentiment swing = perspective gap (we misread them)
    if (predicted !== undefined && Math.abs(predicted - sentiment) > 0.8) this.perspectiveGaps++;

    // predict next: assume mild regression toward their trend
    this.predictions.set(userId, Number((m.sentimentTrend * 0.6 + sentiment * 0.4).toFixed(3)));
  }

  /** Infer an expectation from message phrasing (real, lightweight). */
  noteExpectation(userId: string, message: string): void {
    const m = this.models.get(userId);
    if (!m) return;
    const lower = message.toLowerCase();
    const add = (e: string) => { if (!m.expectations.includes(e)) m.expectations.push(e); };
    if (/\b(nhanh|gấp|asap|urgent|ngay)\b/.test(lower)) add('wants speed');
    if (/\b(chi tiết|đầy đủ|detail|explain|giải thích)\b/.test(lower)) add('wants detail');
    if (/\b(ngắn|gọn|tóm tắt|brief|short)\b/.test(lower)) add('wants brevity');
    if (m.expectations.length > 5) m.expectations = m.expectations.slice(-5);
  }

  getState(): TheoryOfMindState {
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
