"use strict";
/**
 * AgentBrain Configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.defaultConfig = {
    brainDir: './brain',
    maxRecallResults: 10,
    memoryDecayRate: 0.01,
    minMemoryConfidence: 0.4,
    enableReflection: true,
    enableEmotions: true,
    enableExpression: true,
    enableSkillTracking: true,
    maintenanceInterval: 6, // every 6 heartbeats
    dbPath: './brain/agentbrain.db',
    reasoningWhisper: {
        enabled: true,
        maxTokens: 700,
    },
    advisorModel: {
        enabled: true,
        provider: 'qwen',
        model: 'Qwen3-4B',
        role: 'verifier-only',
        maxTokens: 256,
    },
    volatileTtlSeconds: {
        price: 300, // 5 minutes — re-search prices older than this
        market: 300,
        balance: 900,
    },
};
//# sourceMappingURL=config.js.map