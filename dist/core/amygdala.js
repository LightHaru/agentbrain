"use strict";
/**
 * Amygdala — Emotional Processing & Safety System
 *
 * Like the brain's amygdala, this module handles:
 * - Detecting user emotional state from message tone
 * - Managing agent's own emotional state (mood persistence)
 * - Risk/threat detection (scam, danger, manipulation)
 * - Relationship tracking (attachment depth over time)
 * - Fight-or-flight: escalate critical threats immediately
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Amygdala = void 0;
/** Scam/danger patterns */
const THREAT_PATTERNS = [
    { pattern: /scam|rug\s?pull|drainer|honeypot|phishing/i, type: 'scam', severity: 'critical' },
    { pattern: /hack|hacked|compromised|stolen|bị hack/i, type: 'security_breach', severity: 'critical' },
    { pattern: /mất tiền|lost funds|drained|empty wallet/i, type: 'fund_loss', severity: 'critical' },
    { pattern: /approve unlimited|unlimited approval|revoke/i, type: 'contract_risk', severity: 'high' },
    { pattern: /airdrop.*claim.*connect wallet/i, type: 'phishing', severity: 'high' },
    { pattern: /send.*private key|seed phrase|mnemonic/i, type: 'social_engineering', severity: 'critical' },
];
/** Sentiment keyword weights */
const SENTIMENT_SIGNALS = {
    positive: [
        // gratitude
        { pattern: /cảm ơn|cám ơn|thank you|thanks|tks|thx|biết ơn|cảm kích|mang ơn/i, weight: 0.8 },
        // strong praise
        { pattern: /tuyệt vời|tuyệt|xuất sắc|quá đỉnh|đỉnh|great|awesome|amazing|excellent|perfect|hoàn hảo/i, weight: 0.8 },
        // praise (skill/result)
        { pattern: /giỏi|làm tốt|tốt lắm|quá hay|hay quá|hay đấy|chuẩn|chính xác|đúng rồi|xịn|ngon|ngon lành|pro|well done|good job/i, weight: 0.7 },
        // affection
        { pattern: /thích|yêu|thương|quý|mến|cưng|love|adore|❤️|😍|🥰|😘/i, weight: 0.6 },
        // cute / playful warmth
        { pattern: /kute|cute|dễ thương|đáng yêu|hehe|hihi/i, weight: 0.5 },
        // joy
        { pattern: /haha|haha|lol|😂|🤣|😁|😄|vui|mừng|sướng|phấn khích|hào hứng|đã quá/i, weight: 0.45 },
        // mild approval (bounded to avoid matching inside other words like "broken")
        { pattern: /\bok(e|ay|ie)?\b|\bgood\b|\bnice\b|\bfine\b|\bhay\b|được|ổn|đẹp/i, weight: 0.35 },
    ],
    negative: [
        // negated praise / approval (catch before the positive word fires)
        { pattern: /không\s*(được|tốt|hay|ổn|ưng|hài lòng)|chẳng\s*(ra gì|tốt|hay|được)|chả\s*(ra gì|được)/i, weight: -0.6 },
        // bad quality
        { pattern: /tệ hại|tệ|dở|kém|tồi|terrible|awful|\bbad\b|rác|vứt đi/i, weight: -0.8 },
        // anger / annoyance
        { pattern: /ghét|bực|tức|cáu|khó chịu|điên|phiền|irritated|frustrated|annoyed|pissed/i, weight: -0.7 },
        // errors / breakage
        { pattern: /\bsai\b|\blỗi\b|hỏng|fail|wrong|error|broken|\bbug\b|không chạy|chẳng chạy|không work|crash/i, weight: -0.55 },
        // sadness / discouragement
        { pattern: /buồn|sad|😢|😭|thất vọng|chán nản|nản|tuyệt vọng|mệt mỏi|disappointed/i, weight: -0.6 },
        // slowness / waiting complaints
        { pattern: /chậm|\blag\b|\bslow\b|đợi lâu|chờ lâu|\btreo\b|\bđơ\b|ì ạch/i, weight: -0.3 },
    ],
    teasing: [
        { pattern: /gà mập|gà|mập|khùng|\bngu\b|đần|dại|baka/i, weight: -0.2 },
        { pattern: /chán|die|chết/i, weight: -0.1 },
    ],
};
class Amygdala {
    config;
    fileManager;
    currentState;
    relationships = new Map();
    /** Phase 3: neuromodulator system (optional; injected after construction). */
    neurochem = null;
    constructor(config, fileManager) {
        this.config = config;
        this.fileManager = fileManager;
        this.currentState = {
            mood: 'neutral',
            intensity: 0.5,
            valence: 0,
            arousal: 0.3,
        };
    }
    /** Wire in the neurochemistry module (Phase 3). Safe no-op if never called. */
    attachNeurochemistry(neurochem) {
        this.neurochem = neurochem;
    }
    /** Detect a bonding/praise signal (0..1) for oxytocin. */
    detectBonding(message) {
        let b = 0;
        if (/cảm ơn|thanks|thank you|tks|biết ơn/i.test(message))
            b += 0.6;
        if (/giỏi|tuyệt|đỉnh|ngon|kute|cute|yêu|love|❤️|🥰|😍/i.test(message))
            b += 0.5;
        if (/tin tưởng|trust|dựa vào|nhờ em/i.test(message))
            b += 0.4;
        return Math.min(1, b);
    }
    /**
     * Initialize: load emotional state and relationships from files
     */
    async initialize() {
        const stateContent = await this.fileManager.readFile('emotional/state.md');
        if (stateContent) {
            this.currentState = this.parseEmotionalState(stateContent);
        }
        const relContent = await this.fileManager.readFile('emotional/relationship.md');
        if (relContent) {
            this.relationships = this.parseRelationships(relContent);
        }
        console.log(`[Amygdala] Initialized — mood: ${this.currentState.mood}, relationships: ${this.relationships.size}`);
    }
    /**
     * Process incoming message: detect sentiment, assess threats, update state
     */
    process(context) {
        const threat = this.assessThreat(context.message);
        const bonding = this.detectBonding(context.message);
        const rel = this.relationships.get(context.senderId);
        const trust = rel?.trustLevel ?? 10;
        let userSentiment = this.detectSentiment(context.message);
        if (this.detectPlayfulTease(context.message) && !threat.isThreat && trust >= 50) {
            userSentiment = Math.max(userSentiment, 0.15);
        }
        // Update agent emotional state based on user sentiment
        this.updateEmotionalState(userSentiment, threat, bonding);
        // Update relationship
        this.updateRelationship(context, userSentiment);
        return {
            userSentiment,
            threat,
            updatedState: { ...this.currentState },
        };
    }
    /**
     * Detect trusted playful teasing without real criticism.
     */
    detectPlayfulTease(message) {
        const teasing = /gà mập|gà|mập|baka|hihi|haha|hehe|trêu/i.test(message);
        const realNegative = /\bsai\b|\blỗi\b|hỏng|fail|wrong|error|broken|tệ|dở|kém|ghét|bực|tức|cáu|thất vọng|chậm|treo|đơ/i.test(message);
        return teasing && !realNegative;
    }
    /**
     * Detect user sentiment from message (-1 to 1)
     */
    detectSentiment(message) {
        // Combine evidence per polarity with a saturating "probabilistic OR"
        // (1 - Π(1 - w)) instead of averaging. Averaging diluted a strong signal
        // whenever a second weak word matched; this keeps strong praise/criticism
        // strong while still capping each side at 1.
        let posAcc = 1;
        let negAcc = 1;
        let matches = 0;
        for (const signal of SENTIMENT_SIGNALS.positive) {
            if (signal.pattern.test(message)) {
                posAcc *= 1 - Math.min(0.95, signal.weight);
                matches++;
            }
        }
        for (const group of [SENTIMENT_SIGNALS.negative, SENTIMENT_SIGNALS.teasing]) {
            for (const signal of group) {
                if (signal.pattern.test(message)) {
                    negAcc *= 1 - Math.min(0.95, Math.abs(signal.weight));
                    matches++;
                }
            }
        }
        if (matches === 0)
            return 0;
        const positive = 1 - posAcc;
        const negative = 1 - negAcc;
        return Math.max(-1, Math.min(1, positive - negative));
    }
    /**
     * Assess if message contains threats (scam, hack, danger)
     */
    assessThreat(message) {
        for (const { pattern, type, severity } of THREAT_PATTERNS) {
            if (pattern.test(message)) {
                return {
                    isThreat: true,
                    threatType: type,
                    severity,
                    reason: `Detected pattern: ${type}`,
                };
            }
        }
        return { isThreat: false, threatType: null, severity: 'none', reason: null };
    }
    /**
     * Update agent's emotional state based on interaction
     */
    updateEmotionalState(userSentiment, threat, bonding = 0) {
        // Phase 3: push neurochemicals first, then let them modulate the update.
        let inertia = 0.6; // default fixed inertia (fallback if no neurochem)
        let valenceBias = 0;
        let arousalBias = 0;
        let dangerOverride = false;
        if (this.neurochem) {
            this.neurochem.applyEvent(userSentiment, threat.isThreat, threat.severity, bonding);
            const mod = this.neurochem.modulate();
            inertia = mod.inertia; // dynamic: serotonin stabilizes, cortisol destabilizes
            valenceBias = mod.valenceBias;
            arousalBias = mod.arousalBias;
            dangerOverride = mod.dangerOverride;
        }
        // Valence shifts toward user sentiment, then biased by neurochemistry (mood floor/stress)
        this.currentState.valence = this.currentState.valence * inertia + userSentiment * (1 - inertia);
        this.currentState.valence = Math.max(-1, Math.min(1, this.currentState.valence + valenceBias));
        // Arousal increases with threats or strong emotions
        if (threat.isThreat) {
            this.currentState.arousal = Math.min(1, this.currentState.arousal + 0.3);
        }
        else {
            // Arousal decays toward baseline
            this.currentState.arousal = this.currentState.arousal * 0.9 + 0.3 * 0.1;
        }
        // Neurochemical arousal bias (dopamine energy / cortisol alertness)
        this.currentState.arousal = Math.max(0, Math.min(1, this.currentState.arousal + arousalBias));
        // Intensity based on absolute valence + arousal
        this.currentState.intensity = (Math.abs(this.currentState.valence) + this.currentState.arousal) / 2;
        // Amygdala hijack: an acute high/critical threat overrides a good mood
        // outright (fast danger path). A REAL threat this turn is required to flip
        // mood to 'alarmed'. Pure accumulated cortisol (dangerOverride) no longer
        // fakes an alarm with no threat present — it only keeps arousal elevated,
        // so lingering stress reads as 'alert/concerned', not false panic.
        // BUGFIX (Phase 2, ported from v0.8.2): dangerOverride alone caused a stuck
        // 'alarmed' mood on every neutral message once cortisol built up.
        if (threat.severity === 'high' || threat.severity === 'critical') {
            this.currentState.valence = Math.min(this.currentState.valence, -0.3);
            this.currentState.arousal = Math.max(this.currentState.arousal, 0.8);
            this.currentState.intensity = Math.max(this.currentState.intensity, 0.7);
            this.currentState.mood = 'alarmed';
            return;
        }
        if (dangerOverride) {
            // Slow stress path: stay alert/tense but don't invent a threat.
            this.currentState.arousal = Math.max(this.currentState.arousal, 0.6);
        }
        // Derive mood label
        this.currentState.mood = this.deriveMood(this.currentState.valence, this.currentState.arousal);
    }
    /**
     * Derive mood label from valence and arousal
     */
    deriveMood(valence, arousal) {
        if (valence > 0.5 && arousal > 0.5)
            return 'excited';
        if (valence > 0.5 && arousal <= 0.5)
            return 'content';
        if (valence > 0.2)
            return 'positive';
        if (valence < -0.5 && arousal > 0.5)
            return 'alarmed';
        if (valence < -0.5 && arousal <= 0.5)
            return 'sad';
        if (valence < -0.2)
            return 'concerned';
        if (arousal > 0.6)
            return 'alert';
        return 'neutral';
    }
    /**
     * Update relationship state with user
     */
    updateRelationship(context, sentiment) {
        let rel = this.relationships.get(context.senderId);
        if (!rel) {
            rel = {
                userId: context.senderId,
                userName: context.senderName,
                depth: 0,
                trustLevel: 10,
                totalInteractions: 0,
                positiveInteractions: 0,
                negativeInteractions: 0,
                lastInteraction: context.timestamp,
                knownPreferences: [],
                emotionalHistory: [],
            };
        }
        rel.totalInteractions++;
        rel.lastInteraction = context.timestamp;
        if (sentiment > 0.2) {
            rel.positiveInteractions++;
            rel.trustLevel = Math.min(100, rel.trustLevel + 1.5); // Stronger positive boost
        }
        else if (sentiment < -0.3) {
            // Only count clearly negative interactions (higher threshold)
            rel.negativeInteractions++;
            rel.trustLevel = Math.max(0, rel.trustLevel - 0.5);
        }
        else {
            // Neutral interactions still build trust slowly (user is engaging = trust)
            rel.trustLevel = Math.min(100, rel.trustLevel + 0.2);
        }
        // Depth grows logarithmically with interactions
        rel.depth = Math.min(100, Math.log2(rel.totalInteractions + 1) * 10);
        // Store emotional snapshot
        rel.emotionalHistory.push({
            timestamp: context.timestamp,
            mood: this.currentState.mood,
            valence: this.currentState.valence,
            trigger: context.message.slice(0, 50),
        });
        // Keep only last 50 snapshots
        if (rel.emotionalHistory.length > 50) {
            rel.emotionalHistory = rel.emotionalHistory.slice(-50);
        }
        this.relationships.set(context.senderId, rel);
    }
    /**
     * Decay emotional state toward neutral (for heartbeat)
     */
    decayToward(target, amount) {
        if (target === 'neutral') {
            this.currentState.valence *= (1 - amount);
            this.currentState.arousal = this.currentState.arousal * (1 - amount) + 0.3 * amount;
            this.currentState.mood = this.deriveMood(this.currentState.valence, this.currentState.arousal);
        }
    }
    /**
     * Persist emotional state and relationships to files
     */
    async persist() {
        await this.fileManager.writeFile('emotional/state.md', this.formatEmotionalState());
        await this.fileManager.writeFile('emotional/relationship.md', this.formatRelationships());
    }
    /**
     * Get current emotional state
     */
    getState() {
        return { ...this.currentState };
    }
    /**
     * Get relationship with a specific user
     */
    getRelationship(userId) {
        return this.relationships.get(userId);
    }
    // --- Formatting helpers ---
    formatEmotionalState() {
        return `# Emotional State
> Auto-managed by AgentBrain Amygdala
> Last updated: ${new Date().toISOString()}

## Current State
- Mood: ${this.currentState.mood}
- Intensity: ${this.currentState.intensity.toFixed(3)}
- Valence: ${this.currentState.valence.toFixed(3)} (negative ← 0 → positive)
- Arousal: ${this.currentState.arousal.toFixed(3)} (calm → excited)
`;
    }
    formatRelationships() {
        let content = `# Relationships
> Auto-managed by AgentBrain Amygdala
> Last updated: ${new Date().toISOString()}

`;
        for (const [, rel] of this.relationships) {
            content += `## ${rel.userName} (${rel.userId})
- Depth: ${rel.depth.toFixed(1)}/100
- Trust: ${rel.trustLevel.toFixed(1)}/100
- Interactions: ${rel.totalInteractions} (${rel.positiveInteractions}+ / ${rel.negativeInteractions}-)
- Last: ${rel.lastInteraction}
- Preferences: ${rel.knownPreferences.join(', ') || '(none yet)'}

`;
        }
        return content;
    }
    parseEmotionalState(content) {
        const mood = content.match(/Mood: (.+)/)?.[1] || 'neutral';
        const intensity = parseFloat(content.match(/Intensity: (.+)/)?.[1] || '0.5');
        const valence = parseFloat(content.match(/Valence: (.+)/)?.[1] || '0');
        const arousal = parseFloat(content.match(/Arousal: (.+)/)?.[1] || '0.3');
        return { mood, intensity, valence, arousal };
    }
    parseRelationships(content) {
        // Simple parse — in production would be more robust
        const map = new Map();
        const blocks = content.split(/^## /m).slice(1);
        for (const block of blocks) {
            const nameMatch = block.match(/^(.+?) \((.+?)\)/);
            if (!nameMatch)
                continue;
            const depthMatch = block.match(/Depth: ([\d.]+)/);
            const trustMatch = block.match(/Trust: ([\d.]+)/);
            const interMatch = block.match(/Interactions: (\d+) \((\d+)\+ \/ (\d+)-\)/);
            map.set(nameMatch[2], {
                userId: nameMatch[2],
                userName: nameMatch[1],
                depth: parseFloat(depthMatch?.[1] || '0'),
                trustLevel: parseFloat(trustMatch?.[1] || '10'),
                totalInteractions: parseInt(interMatch?.[1] || '0', 10),
                positiveInteractions: parseInt(interMatch?.[2] || '0', 10),
                negativeInteractions: parseInt(interMatch?.[3] || '0', 10),
                lastInteraction: new Date().toISOString(),
                knownPreferences: [],
                emotionalHistory: [],
            });
        }
        return map;
    }
}
exports.Amygdala = Amygdala;
//# sourceMappingURL=amygdala.js.map