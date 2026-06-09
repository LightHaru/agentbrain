"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hypothalamus = void 0;
/**
 * Hypothalamus — homeostatic drives + circadian regulation
 *
 * REAL state: drives decay over elapsed time since lastSatisfied, and are
 * satisfied by actual pipeline events (learning a topic feeds curiosity,
 * a social message feeds social, a task success feeds achievement, etc).
 * Homeostasis and current motivation are computed from live drive intensities,
 * not hardcoded.
 */
const circadian_js_1 = require("./circadian.js");
const DRIVE_ACTIONS = {
    curiosity: 'Explore a new idea or learn something',
    social: 'Connect with the user or check in',
    achievement: 'Complete a task or solve a problem',
    rest: 'Slow down and recover',
    novelty: 'Try a different approach or topic',
    order: 'Organize, clean up, or document',
};
class Hypothalamus {
    timezone;
    drives = new Map();
    stress = 0; // 0..1, fed by amygdala threats
    lastUpdate = Date.now();
    constructor(timezone = 'Asia/Ho_Chi_Minh', now = Date.now()) {
        this.timezone = timezone;
        this.lastUpdate = now;
        const seed = [
            ['curiosity', 'Curiosity & Learning', 0.02, 3],
            ['social', 'Social Connection', 0.015, 4],
            ['achievement', 'Achievement & Mastery', 0.025, 5],
            ['rest', 'Rest & Recovery', 0.01, 2],
            ['novelty', 'Novelty Seeking', 0.03, 2],
            ['order', 'Order & Organization', 0.01, 1],
        ];
        for (const [id, name, decayRate, priority] of seed) {
            this.drives.set(id, { id, name, intensity: 0.3, lastSatisfied: now, decayRate, priority });
        }
    }
    /** Let drives grow with neglect. Called on heartbeat or before reading state. */
    tick(now = Date.now()) {
        const minutes = (now - this.lastUpdate) / 60000;
        if (minutes <= 0)
            return;
        for (const d of this.drives.values()) {
            d.intensity = Math.min(1, d.intensity + d.decayRate * minutes);
        }
        // Stress slowly self-regulates toward calm
        this.stress = Math.max(0, this.stress - 0.05 * minutes);
        this.lastUpdate = now;
    }
    /** Satisfy a drive (reduces its intensity). Called from real pipeline events. */
    satisfy(driveId, amount = 0.4) {
        const d = this.drives.get(driveId);
        if (!d)
            return;
        d.intensity = Math.max(0, d.intensity - amount);
        d.lastSatisfied = Date.now();
    }
    /** Map a classified message into drive satisfaction. */
    observe(topic, sentiment, taskSucceeded) {
        this.tick();
        if (topic && topic !== 'general')
            this.satisfy('curiosity', 0.25);
        if (sentiment > 0.2)
            this.satisfy('social', 0.3);
        if (taskSucceeded === true)
            this.satisfy('achievement', 0.5);
        // Novelty satisfied by any new topic interaction
        this.satisfy('novelty', 0.15);
    }
    /** Stress fed from amygdala threat severity. */
    registerThreat(severity) {
        const bump = { low: 0.1, medium: 0.25, high: 0.5, critical: 0.7 }[severity] ?? 0;
        this.stress = Math.min(1, this.stress + bump);
    }
    getState() {
        this.tick();
        const c = (0, circadian_js_1.getCurrentCircadianPhase)(this.timezone);
        // Rest drive scales with low alertness
        const rest = this.drives.get('rest');
        if (c.alertness < 0.3)
            rest.intensity = Math.max(rest.intensity, 0.7);
        const drives = Array.from(this.drives.values())
            .map((d) => ({ ...d })) // return copies, not live internal references
            .sort((a, b) => b.intensity - a.intensity);
        const top = drives[0];
        const energy = Math.round(c.alertness * 100 * (1 - this.stress * 0.3));
        const overallBalance = Number((1 - drives.reduce((s, d) => s + d.intensity, 0) / drives.length - this.stress * 0.2).toFixed(2));
        const stressResponse = this.stress >= 0.6 ? 'stressed' : this.stress >= 0.3 ? 'guarded' : 'calm';
        const urgency = top.intensity >= 0.75 ? 'high' : top.intensity >= 0.45 ? 'medium' : 'low';
        return {
            circadian: {
                currentPhase: c.phase,
                alertnessLevel: c.alertness,
                optimalForCreativity: c.phase === 'morning',
                optimalForAnalysis: c.phase === 'morning' || c.phase === 'afternoon',
                optimalForRoutine: c.alertness >= 0.6,
                hourOfDay: c.hour,
                timezone: this.timezone,
            },
            drives,
            homeostasis: {
                energy,
                stress: Math.round(this.stress * 100),
                curiosity: Math.round((this.drives.get('curiosity').intensity) * 100),
                socialNeed: Math.round((this.drives.get('social').intensity) * 100),
                achievementNeed: Math.round((this.drives.get('achievement').intensity) * 100),
                restNeed: Math.round(rest.intensity * 100),
                overallBalance: Math.max(0, Math.min(1, overallBalance)),
            },
            currentMotivation: {
                primaryDrive: top.name,
                intensity: Number(top.intensity.toFixed(2)),
                suggestedAction: DRIVE_ACTIONS[top.id] ?? 'Maintain balance',
                urgency,
            },
            stressResponse,
        };
    }
}
exports.Hypothalamus = Hypothalamus;
//# sourceMappingURL=hypothalamus.js.map