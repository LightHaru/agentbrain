/**
 * Thalamus — Context Router & Attention Gate
 *
 * Like the brain's thalamus, this module acts as a relay station:
 * - Classifies incoming messages (intent, urgency, topic, tone)
 * - Routes to appropriate processing modules
 * - Filters noise and focuses attention on relevant info
 */
import { BrainConfig } from './config.js';
import { MessageContext, MessageClassification } from '../index.js';
export declare class Thalamus {
    private config;
    constructor(config: BrainConfig);
    /**
     * Classify an incoming message — the first step in every brain cycle
     */
    classify(context: MessageContext): MessageClassification;
    /**
     * Detect primary intent of the message
     */
    private detectIntent;
    /**
     * Detect urgency level
     */
    private detectUrgency;
    /**
     * Detect primary topic
     */
    private detectTopic;
    /**
     * Detect emotional tone
     */
    private detectTone;
    /**
     * Determine if message requires agent to take action (vs just respond)
     */
    private requiresAction;
    /**
     * Determine which brain modules should be activated for this message
     */
    routeToModules(classification: MessageClassification): string[];
}
//# sourceMappingURL=thalamus.d.ts.map