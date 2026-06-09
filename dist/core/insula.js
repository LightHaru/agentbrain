"use strict";
/**
 * Insula — Self-Awareness & Empathy
 *
 * Like the brain's insula, this module handles:
 * - Interoception: Awareness of internal "body" state (energy, fatigue, stress)
 * - Self-awareness: Performance monitoring, confidence, limitations
 * - Empathy: Modeling user's mental/emotional state
 * - Emotional self-regulation
 *
 * Key functions:
 * - Monitor agent's own performance and well-being
 * - Detect when agent needs rest or is overloaded
 * - Model user's emotional state and needs
 * - Generate empathetic responses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Insula = void 0;
const circadian_js_1 = require("./circadian.js");
// ============================================================================
// Insula Class
// ============================================================================
class Insula {
    config;
    /** Current body state */
    bodyState;
    /** Performance history (last N actions) */
    performanceHistory;
    /** User state model */
    userState;
    /** Maximum performance history size */
    HISTORY_SIZE = 50;
    /** Energy decay rate per minute */
    ENERGY_DECAY_RATE = 0.5;
    /** Fatigue accumulation rate per task */
    FATIGUE_RATE = 2;
    /** Rest recovery rate per minute */
    RECOVERY_RATE = 5;
    constructor(config) {
        this.config = config;
        // Initialize with healthy state
        this.bodyState = {
            energy: 100,
            fatigue: 0,
            stress: 0,
            lastRest: Date.now(),
            cognitiveLoad: 0,
            idleTime: 0,
            circadianPhase: (0, circadian_js_1.getCircadianPhase)(new Date().getHours(), 'Asia/Ho_Chi_Minh'),
        };
        this.performanceHistory = [];
        // Initialize neutral user state
        this.userState = {
            emotion: { valence: 0, arousal: 0.5, dominance: 0.5 },
            goals: [],
            frustrationLevel: 0,
            satisfactionLevel: 0.5,
            needsSupport: false,
            confidence: 0.5,
        };
    }
    // ==========================================================================
    // Self-Awareness & Performance Monitoring
    // ==========================================================================
    /**
     * Assess current performance
     */
    assessPerformance() {
        if (this.performanceHistory.length === 0) {
            return {
                successRate: 0.5,
                recentErrors: 0,
                confidence: 0.5,
                needsImprovement: [],
                strengths: [],
                trend: 'stable',
            };
        }
        // Calculate success rate (last 20 actions)
        const recent = this.performanceHistory.slice(-20);
        const successes = recent.filter(h => h.success).length;
        const successRate = successes / recent.length;
        // Count recent errors
        const recentErrors = recent.filter(h => !h.success).length;
        // Calculate confidence based on success rate and consistency
        const confidence = this.calculateConfidence(recent);
        // Identify areas needing improvement
        const needsImprovement = this.identifyWeaknesses(recent);
        // Identify strengths
        const strengths = this.identifyStrengths(recent);
        // Determine trend
        const trend = this.calculateTrend();
        return {
            successRate,
            recentErrors,
            confidence,
            needsImprovement,
            strengths,
            trend,
        };
    }
    /**
     * Calculate confidence based on performance consistency
     */
    calculateConfidence(history) {
        if (history.length < 5)
            return 0.5;
        const successRate = history.filter(h => h.success).length / history.length;
        // Check consistency (variance in success)
        const recentSuccesses = history.slice(-10).filter(h => h.success).length;
        const consistency = recentSuccesses / Math.min(10, history.length);
        return (successRate + consistency) / 2;
    }
    /**
     * Identify areas needing improvement
     */
    identifyWeaknesses(history) {
        const weaknesses = [];
        // Group by task type
        const byType = new Map();
        for (const h of history) {
            const stats = byType.get(h.taskType) || { success: 0, total: 0 };
            stats.total++;
            if (h.success)
                stats.success++;
            byType.set(h.taskType, stats);
        }
        // Find task types with low success rate
        for (const [type, stats] of byType.entries()) {
            if (stats.total >= 3 && stats.success / stats.total < 0.5) {
                weaknesses.push(type);
            }
        }
        return weaknesses;
    }
    /**
     * Identify strengths
     */
    identifyStrengths(history) {
        const strengths = [];
        // Group by task type
        const byType = new Map();
        for (const h of history) {
            const stats = byType.get(h.taskType) || { success: 0, total: 0 };
            stats.total++;
            if (h.success)
                stats.success++;
            byType.set(h.taskType, stats);
        }
        // Find task types with high success rate
        for (const [type, stats] of byType.entries()) {
            if (stats.total >= 3 && stats.success / stats.total > 0.8) {
                strengths.push(type);
            }
        }
        return strengths;
    }
    /**
     * Calculate performance trend
     */
    calculateTrend() {
        if (this.performanceHistory.length < 10)
            return 'stable';
        const firstHalf = this.performanceHistory.slice(0, Math.floor(this.performanceHistory.length / 2));
        const secondHalf = this.performanceHistory.slice(Math.floor(this.performanceHistory.length / 2));
        const firstRate = firstHalf.filter(h => h.success).length / firstHalf.length;
        const secondRate = secondHalf.filter(h => h.success).length / secondHalf.length;
        const diff = secondRate - firstRate;
        if (diff > 0.1)
            return 'improving';
        if (diff < -0.1)
            return 'declining';
        return 'stable';
    }
    /**
     * Record a performance event
     */
    recordPerformance(success, taskType, duration) {
        this.performanceHistory.push({
            timestamp: Date.now(),
            success,
            taskType,
            duration,
        });
        // Trim history
        if (this.performanceHistory.length > this.HISTORY_SIZE) {
            this.performanceHistory.shift();
        }
        // Update body state based on performance
        if (!success) {
            this.bodyState.stress = Math.min(100, this.bodyState.stress + 5);
        }
        this.bodyState.fatigue = Math.min(100, this.bodyState.fatigue + this.FATIGUE_RATE);
        this.bodyState.energy = Math.max(0, this.bodyState.energy - this.ENERGY_DECAY_RATE);
    }
    // ==========================================================================
    // Interoception (Body State Awareness)
    // ==========================================================================
    /**
     * Get current energy level
     */
    getEnergyLevel() {
        return this.bodyState.energy;
    }
    /**
     * Get current fatigue level
     */
    getFatigueLevel() {
        return this.bodyState.fatigue;
    }
    /**
     * Get current stress level
     */
    getStressLevel() {
        return this.bodyState.stress;
    }
    /**
     * Update body state
     */
    updateBodyState(metrics) {
        this.bodyState = { ...this.bodyState, ...metrics };
    }
    /**
     * Check if agent needs rest
     */
    needsRest() {
        return (this.bodyState.energy < 20 ||
            this.bodyState.fatigue > 80 ||
            this.bodyState.stress > 70);
    }
    /**
     * Simulate rest/recovery
     */
    rest(durationMinutes) {
        this.bodyState.energy = Math.min(100, this.bodyState.energy + this.RECOVERY_RATE * durationMinutes);
        this.bodyState.fatigue = Math.max(0, this.bodyState.fatigue - this.RECOVERY_RATE * durationMinutes);
        this.bodyState.stress = Math.max(0, this.bodyState.stress - this.RECOVERY_RATE * durationMinutes * 0.5);
        this.bodyState.lastRest = Date.now();
    }
    /**
     * Update cognitive load
     */
    updateCognitiveLoad(load) {
        this.bodyState.cognitiveLoad = Math.max(0, Math.min(100, load));
        // High cognitive load increases fatigue and stress
        if (load > 70) {
            this.bodyState.fatigue = Math.min(100, this.bodyState.fatigue + 1);
            this.bodyState.stress = Math.min(100, this.bodyState.stress + 0.5);
        }
    }
    /**
     * Get body state
     */
    getBodyState() {
        return { ...this.bodyState };
    }
    // ==========================================================================
    // Empathy & User Modeling
    // ==========================================================================
    /**
     * Model user's mental/emotional state
     */
    modelUserState(context) {
        // Update circadian phase
        this.bodyState.circadianPhase = (0, circadian_js_1.getCircadianPhase)(context.timeOfDay, 'Asia/Ho_Chi_Minh');
        const msg = context.message.toLowerCase();
        // Detect emotion from message
        const emotion = this.detectUserEmotion(msg);
        // Infer goals
        const goals = this.inferUserGoals(msg);
        // Detect frustration
        const frustrationLevel = this.detectFrustration(msg, context.userSuccessRate);
        // Estimate satisfaction
        const satisfactionLevel = this.estimateSatisfaction(context.userSuccessRate, emotion.valence);
        // Determine if user needs support
        const needsSupport = frustrationLevel > 0.6 || emotion.valence < -0.5;
        // Predict next action (simple heuristic)
        const predictedNextAction = this.predictUserAction(msg, goals);
        // Calculate confidence
        const confidence = this.calculateUserModelConfidence(context.recentInteractions);
        this.userState = {
            emotion,
            goals,
            frustrationLevel,
            satisfactionLevel,
            needsSupport,
            predictedNextAction,
            confidence,
        };
        return this.userState;
    }
    /**
     * Detect user emotion from message
     */
    detectUserEmotion(message) {
        let valence = 0;
        let arousal = 0.5;
        let dominance = 0.5;
        // Positive words
        const positiveWords = ['good', 'great', 'awesome', 'excellent', 'love', 'happy', 'thanks', 'perfect', 'tốt', 'hay', 'đỉnh', 'cảm ơn'];
        for (const word of positiveWords) {
            if (message.includes(word))
                valence += 0.2;
        }
        // Negative words
        const negativeWords = ['bad', 'terrible', 'hate', 'angry', 'frustrated', 'wrong', 'error', 'fail', 'tệ', 'ghét', 'tức', 'lỗi'];
        for (const word of negativeWords) {
            if (message.includes(word))
                valence -= 0.2;
        }
        // High arousal indicators
        const excitedWords = ['!!!', 'urgent', 'asap', 'now', 'quick', 'gấp', 'nhanh'];
        for (const word of excitedWords) {
            if (message.includes(word))
                arousal += 0.2;
        }
        // Dominance indicators
        const commandWords = ['do', 'make', 'create', 'fix', 'change', 'làm', 'sửa', 'tạo'];
        for (const word of commandWords) {
            if (message.includes(word))
                dominance += 0.1;
        }
        return {
            valence: Math.max(-1, Math.min(1, valence)),
            arousal: Math.max(0, Math.min(1, arousal)),
            dominance: Math.max(0, Math.min(1, dominance)),
        };
    }
    /**
     * Infer user goals from message
     */
    inferUserGoals(message) {
        const goals = [];
        if (message.includes('fix') || message.includes('sửa'))
            goals.push('fix-problem');
        if (message.includes('create') || message.includes('tạo'))
            goals.push('create-something');
        if (message.includes('learn') || message.includes('understand') || message.includes('hiểu'))
            goals.push('learn');
        if (message.includes('help') || message.includes('giúp'))
            goals.push('get-help');
        return goals;
    }
    /**
     * Detect user frustration
     */
    detectFrustration(message, userSuccessRate) {
        let frustration = 0;
        // Low success rate = frustration
        if (userSuccessRate < 0.5)
            frustration += 0.3;
        // Frustration keywords
        const frustrationWords = ['why', 'again', 'still', 'not working', 'doesn\'t work', 'tại sao', 'vẫn', 'không được'];
        for (const word of frustrationWords) {
            if (message.includes(word))
                frustration += 0.2;
        }
        // Repeated questions
        if (message.includes('???') || message.includes('!!!'))
            frustration += 0.1;
        return Math.min(1, frustration);
    }
    /**
     * Estimate user satisfaction
     */
    estimateSatisfaction(userSuccessRate, emotionValence) {
        return (userSuccessRate + (emotionValence + 1) / 2) / 2;
    }
    /**
     * Predict user's next action
     */
    predictUserAction(message, goals) {
        if (goals.includes('fix-problem'))
            return 'request-fix';
        if (goals.includes('create-something'))
            return 'request-creation';
        if (goals.includes('learn'))
            return 'ask-question';
        if (goals.includes('get-help'))
            return 'request-help';
        return 'continue-conversation';
    }
    /**
     * Calculate confidence in user model
     */
    calculateUserModelConfidence(recentInteractions) {
        // More interactions = higher confidence
        return Math.min(1, recentInteractions / 10);
    }
    /**
     * Generate empathetic response
     */
    generateEmpatheticResponse(userEmotion) {
        let tone = 'neutral';
        let empathyLevel = 0.5;
        let text = '';
        // Determine tone based on emotion
        if (userEmotion.valence < -0.5) {
            tone = 'supportive';
            empathyLevel = 0.8;
            text = 'Em hiểu Sếp đang gặp khó khăn. Để em giúp Sếp nhé!';
        }
        else if (userEmotion.valence > 0.5) {
            tone = 'celebratory';
            empathyLevel = 0.7;
            text = 'Tuyệt vời! Em mừng cho Sếp! (✧ω✧)';
        }
        else if (userEmotion.arousal > 0.7) {
            tone = 'calming';
            empathyLevel = 0.6;
            text = 'Em sẽ xử lý ngay cho Sếp!';
        }
        else {
            tone = 'encouraging';
            empathyLevel = 0.5;
            text = 'Em sẽ cố gắng hết sức!';
        }
        return { text, tone, empathyLevel };
    }
    /**
     * Get current user state model
     */
    getUserState() {
        return { ...this.userState };
    }
    // ==========================================================================
    // Self-Regulation
    // ==========================================================================
    /**
     * Determine if self-regulation action is needed
     */
    regulateEmotion(currentEmotion) {
        // Check if agent needs rest
        if (this.needsRest()) {
            return {
                type: 'rest',
                reason: 'Energy low or fatigue/stress high',
                urgency: 0.8,
            };
        }
        // Check if cognitive load is too high
        if (this.bodyState.cognitiveLoad > 80) {
            return {
                type: 'reduce-load',
                reason: 'Cognitive overload',
                urgency: 0.7,
            };
        }
        // Check if performance is declining
        const assessment = this.assessPerformance();
        if (assessment.trend === 'declining' && assessment.successRate < 0.5) {
            return {
                type: 'seek-help',
                reason: 'Performance declining, may need assistance',
                urgency: 0.6,
            };
        }
        // Check if doing well
        if (assessment.successRate > 0.8 && currentEmotion.valence > 0.5) {
            return {
                type: 'celebrate',
                reason: 'High performance, positive emotion',
                urgency: 0.3,
            };
        }
        // Default: continue
        return {
            type: 'continue',
            reason: 'All systems normal',
            urgency: 0,
        };
    }
    // ==========================================================================
    // Introspection & Debugging
    // ==========================================================================
    /**
     * Get circadian-adjusted alertness
     */
    getAlertness() {
        if (!this.bodyState.circadianPhase) {
            return 0.7; // default
        }
        // Adjust alertness based on energy and fatigue
        const baseAlertness = this.bodyState.circadianPhase.alertness;
        const energyFactor = this.bodyState.energy / 100;
        const fatigueFactor = 1 - (this.bodyState.fatigue / 100);
        return baseAlertness * energyFactor * fatigueFactor;
    }
    /**
     * Get current state for debugging
     */
    getState() {
        return {
            bodyState: this.bodyState,
            performanceHistorySize: this.performanceHistory.length,
            recentSuccessRate: this.assessPerformance().successRate,
            needsRest: this.needsRest(),
            userFrustration: this.userState.frustrationLevel,
            userSatisfaction: this.userState.satisfactionLevel,
            alertness: this.getAlertness(),
            circadianPhase: this.bodyState.circadianPhase?.phase,
        };
    }
}
exports.Insula = Insula;
//# sourceMappingURL=insula.js.map