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
    enableSkillTracking: true,
    maintenanceInterval: 6, // every 6 heartbeats
    dbPath: './brain/agentbrain.db',
};
//# sourceMappingURL=config.js.map