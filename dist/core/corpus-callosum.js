"use strict";
/**
 * Corpus Callosum — Inter-Module Communication Bus
 *
 * Like the brain's corpus callosum connecting left/right hemispheres,
 * this module handles:
 * - Message passing between brain modules
 * - Event broadcasting (one module notifies all others)
 * - Priority routing (urgent signals get fast-tracked)
 * - Synchronization (ensure modules have consistent state)
 * - Conflict resolution (when modules disagree)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorpusCallosum = void 0;
// --- Corpus Callosum Module ---
class CorpusCallosum {
    config;
    modules = new Map();
    signalQueue = [];
    processedSignals = [];
    conflicts = [];
    listeners = new Map();
    totalMessages = 0;
    droppedMessages = 0;
    startTime = Date.now();
    signalCounter = 0;
    constructor(config) {
        this.config = config;
    }
    /**
     * Register a brain module with the communication bus
     */
    registerModule(id, name, capabilities, subscribedEvents = []) {
        this.modules.set(id, {
            id,
            name,
            capabilities,
            subscribedEvents,
            lastActive: Date.now(),
            messagesSent: 0,
            messagesReceived: 0,
        });
    }
    /**
     * Subscribe to events from the bus
     */
    subscribe(moduleId, eventType, callback) {
        const key = `${moduleId}:${eventType}`;
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
        // Update module subscription
        const mod = this.modules.get(moduleId);
        if (mod && !mod.subscribedEvents.includes(eventType)) {
            mod.subscribedEvents.push(eventType);
        }
    }
    /**
     * Send a signal between modules
     */
    send(signal) {
        const id = `sig-${++this.signalCounter}-${Date.now()}`;
        const fullSignal = {
            ...signal,
            id,
            timestamp: Date.now(),
            processed: false,
        };
        // Update sender stats
        const sender = this.modules.get(signal.source);
        if (sender) {
            sender.messagesSent++;
            sender.lastActive = Date.now();
        }
        this.totalMessages++;
        // Critical signals are processed immediately
        if (signal.priority === 'critical') {
            this.processSignal(fullSignal);
        }
        else {
            this.signalQueue.push(fullSignal);
        }
        return id;
    }
    /**
     * Broadcast a signal to all modules
     */
    broadcast(source, type, payload, priority = 'normal') {
        return this.send({
            source,
            target: '*',
            type,
            priority,
            payload,
            ttl: 30000, // 30 seconds
        });
    }
    /**
     * Query a specific module for data
     */
    query(source, target, queryPayload) {
        return this.send({
            source,
            target,
            type: 'query',
            priority: 'normal',
            payload: queryPayload,
            ttl: 10000, // 10 seconds
        });
    }
    /**
     * Send an alert (high priority broadcast)
     */
    alert(source, alertPayload) {
        return this.send({
            source,
            target: '*',
            type: 'alert',
            priority: 'critical',
            payload: alertPayload,
            ttl: 60000, // 1 minute
        });
    }
    /**
     * Process pending signals in the queue
     */
    processQueue() {
        const now = Date.now();
        let processed = 0;
        let dropped = 0;
        // Sort by priority (critical > high > normal > low)
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        this.signalQueue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        const remaining = [];
        for (const signal of this.signalQueue) {
            // Check TTL
            if (now - signal.timestamp > signal.ttl) {
                dropped++;
                this.droppedMessages++;
                continue;
            }
            this.processSignal(signal);
            processed++;
        }
        this.signalQueue = remaining;
        return { processed, dropped };
    }
    /**
     * Report a conflict between modules
     */
    reportConflict(modules, issue) {
        const id = `conflict-${Date.now()}`;
        const resolution = this.resolveConflict(modules, issue);
        const report = {
            id,
            modules,
            issue,
            resolution,
            timestamp: Date.now(),
            resolved: true,
        };
        this.conflicts.push(report);
        // Keep bounded
        if (this.conflicts.length > 50) {
            this.conflicts = this.conflicts.slice(-25);
        }
        return resolution;
    }
    /**
     * Get metrics about the communication bus
     */
    getMetrics() {
        const uptimeMinutes = (Date.now() - this.startTime) / 60000;
        const messagesPerMinute = uptimeMinutes > 0 ? this.totalMessages / uptimeMinutes : 0;
        // Calculate average latency from processed signals
        let avgLatency = 0;
        if (this.processedSignals.length > 0) {
            const recent = this.processedSignals.slice(-20);
            avgLatency = recent.reduce((sum, s) => sum + (Date.now() - s.timestamp), 0) / recent.length;
        }
        return {
            totalMessages: this.totalMessages,
            messagesPerMinute: Math.round(messagesPerMinute * 100) / 100,
            averageLatency: Math.round(avgLatency),
            droppedMessages: this.droppedMessages,
            activeModules: this.modules.size,
            conflicts: this.conflicts.length,
        };
    }
    /**
     * Get registered modules
     */
    getRegisteredModules() {
        return Array.from(this.modules.values());
    }
    /**
     * Check if a module is registered and active
     */
    isModuleActive(moduleId) {
        const mod = this.modules.get(moduleId);
        if (!mod)
            return false;
        // Consider active if last activity within 5 minutes
        return (Date.now() - mod.lastActive) < 300000;
    }
    /**
     * Get full state for status reporting
     */
    getState() {
        return {
            registeredModules: Array.from(this.modules.values()),
            pendingSignals: this.signalQueue.length,
            processedSignals: this.totalMessages,
            metrics: this.getMetrics(),
            recentConflicts: this.conflicts.slice(-5),
        };
    }
    /**
     * Heartbeat — process queue and maintain bus health
     */
    heartbeat() {
        const result = this.processQueue();
        return {
            ...result,
            activeModules: this.modules.size,
        };
    }
    /**
     * Process a single signal
     */
    processSignal(signal) {
        signal.processed = true;
        if (signal.target === '*') {
            // Broadcast to all modules
            for (const [moduleId, mod] of this.modules) {
                if (moduleId !== signal.source) {
                    mod.messagesReceived++;
                    mod.lastActive = Date.now();
                    this.notifyListeners(moduleId, signal);
                }
            }
        }
        else {
            // Direct message
            const target = this.modules.get(signal.target);
            if (target) {
                target.messagesReceived++;
                target.lastActive = Date.now();
                this.notifyListeners(signal.target, signal);
            }
        }
        // Store in processed history
        this.processedSignals.push(signal);
        if (this.processedSignals.length > 200) {
            this.processedSignals = this.processedSignals.slice(-100);
        }
    }
    /**
     * Notify listeners for a module
     */
    notifyListeners(moduleId, signal) {
        // Check for specific event listeners
        const key = `${moduleId}:${signal.type}`;
        const listeners = this.listeners.get(key) || [];
        for (const listener of listeners) {
            try {
                listener(signal);
            }
            catch (err) {
                // Listener error — don't crash the bus
            }
        }
        // Check for wildcard listeners
        const wildcardKey = `${moduleId}:*`;
        const wildcardListeners = this.listeners.get(wildcardKey) || [];
        for (const listener of wildcardListeners) {
            try {
                listener(signal);
            }
            catch (err) {
                // Listener error — don't crash the bus
            }
        }
    }
    /**
     * Resolve a conflict between modules using priority rules
     */
    resolveConflict(modules, issue) {
        // Priority order for conflict resolution
        const priorityMap = {
            brainstem: 10, // Safety first
            hypothalamus: 9, // Basic needs
            amygdala: 8, // Emotional safety
            prefrontal: 7, // Executive decision
            cingulate: 6, // Conflict monitoring
            temporal: 5, // Language
            parietal: 4, // Attention
            insula: 3, // Self-awareness
            metacognition: 2, // Meta-level
            hippocampus: 1, // Memory
            cerebellum: 0, // Skills (lowest)
        };
        // Find highest priority module
        let winner = modules[0];
        let highestPriority = -1;
        for (const mod of modules) {
            const priority = priorityMap[mod] ?? 0;
            if (priority > highestPriority) {
                highestPriority = priority;
                winner = mod;
            }
        }
        return `Resolved in favor of ${winner} (priority ${highestPriority}): ${issue}`;
    }
}
exports.CorpusCallosum = CorpusCallosum;
//# sourceMappingURL=corpus-callosum.js.map