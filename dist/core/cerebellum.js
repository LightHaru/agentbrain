"use strict";
/**
 * Cerebellum — Skill & Habit Learning Engine
 *
 * Like the brain's cerebellum, this module handles:
 * - Detecting repeated patterns in user requests
 * - Tracking skill proficiency (what agent is good/bad at)
 * - Auto-creating shortcuts for frequent workflows
 * - Habit formation: if X happens N times → automate
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cerebellum = void 0;
/** Skill categories and their detection patterns */
const SKILL_PATTERNS = {
    'crypto-analysis': [/phân tích|analyze|check.*token|price|chart|long|short/i],
    'code-writing': [/code|viết.*code|build|tạo.*app|component|function/i],
    'code-debugging': [/fix|bug|lỗi|error|debug|crash/i],
    'content-writing': [/viết.*bài|blog|article|content|seo/i],
    'research': [/tìm hiểu|research|tìm.*giúp|investigate|đánh giá/i],
    'web-research': [/search|tìm.*kiếm|web.*search|google|lookup|fact.*check|source|citation/i],
    'ops-server': [/server|deploy|nginx|docker|systemctl|vps/i],
    'image-generation': [/hình|image|ảnh|generate.*image|tạo.*hình/i],
    'planning': [/plan|kế hoạch|roadmap|architecture|thiết kế/i],
    'social-media': [/tweet|post|thread|đăng|twitter|x\b/i],
};
/** Relationship patterns for habit detection */
const RELATIONSHIP_PATTERNS = {
    'nickname-usage': [/gà mập|gà|em yêu|baby|bé|cutie|kute/i],
    'greeting-style': [/chào|hi|hello|hey|yo/i],
    'time-of-day': [/sáng|chiều|tối|đêm|morning|afternoon|evening|night/i],
};
class Cerebellum {
    config;
    fileManager;
    skills = new Map();
    habits = [];
    recentPatterns = [];
    constructor(config, fileManager) {
        this.config = config;
        this.fileManager = fileManager;
    }
    /**
     * Initialize: load skills and habits from files
     */
    async initialize() {
        const skillsContent = await this.fileManager.readFile('skills/proficiency.md');
        if (skillsContent) {
            this.skills = this.parseSkills(skillsContent);
        }
        const habitsContent = await this.fileManager.readFile('skills/habits.md');
        if (habitsContent) {
            this.habits = this.parseHabits(habitsContent);
        }
        console.log(`[Cerebellum] Initialized — ${this.skills.size} skills, ${this.habits.length} habits`);
    }
    /**
     * Detect which skill is being used in this interaction
     */
    detectSkill(message) {
        for (const [skill, patterns] of Object.entries(SKILL_PATTERNS)) {
            for (const pattern of patterns) {
                if (pattern.test(message)) {
                    return skill;
                }
            }
        }
        return null;
    }
    /**
     * Record skill usage after a task
     */
    recordSkillUsage(skillName, success) {
        let skill = this.skills.get(skillName);
        if (!skill) {
            skill = {
                id: `skill-${skillName}`,
                name: skillName,
                category: skillName.split('-')[0] || 'general',
                proficiency: 30, // start at beginner
                timesUsed: 0,
                lastUsed: new Date().toISOString(),
                successRate: 0,
                successes: 0,
                failures: 0,
            };
        }
        skill.timesUsed++;
        skill.lastUsed = new Date().toISOString();
        if (success) {
            skill.successes++;
        }
        else {
            skill.failures++;
        }
        skill.successRate = skill.successes / skill.timesUsed;
        // Proficiency grows with successful usage, decays with failure
        if (success) {
            skill.proficiency = Math.min(100, skill.proficiency + 2);
        }
        else {
            skill.proficiency = Math.max(0, skill.proficiency - 1);
        }
        this.skills.set(skillName, skill);
    }
    /**
     * Detect patterns/habits from repeated requests
     */
    detectPattern(message, timestamp) {
        const skill = this.detectSkill(message);
        if (!skill)
            return null;
        this.recentPatterns.push({ pattern: skill, timestamp });
        // Keep only last 100 patterns
        if (this.recentPatterns.length > 100) {
            this.recentPatterns = this.recentPatterns.slice(-100);
        }
        // Count occurrences of this pattern in recent history
        const count = this.recentPatterns.filter(p => p.pattern === skill).length;
        // If pattern appears 5+ times, it's becoming a habit
        if (count >= 5) {
            const existingHabit = this.habits.find(h => h.pattern === skill);
            if (existingHabit) {
                existingHabit.frequency = count;
                existingHabit.lastSeen = timestamp;
                existingHabit.confidence = Math.min(1, count / 10);
                return existingHabit;
            }
            else {
                const newHabit = {
                    id: `habit-${Date.now().toString(36)}`,
                    pattern: skill,
                    action: `Proactively prepare for ${skill} tasks`,
                    frequency: count,
                    confidence: count / 10,
                    firstSeen: this.recentPatterns.find(p => p.pattern === skill)?.timestamp || timestamp,
                    lastSeen: timestamp,
                    active: true,
                };
                this.habits.push(newHabit);
                return newHabit;
            }
        }
        return null;
    }
    /**
     * Detect relationship patterns (nicknames, greetings, time-of-day)
     */
    detectRelationshipPattern(message, timestamp) {
        for (const [patternType, patterns] of Object.entries(RELATIONSHIP_PATTERNS)) {
            for (const pattern of patterns) {
                if (pattern.test(message)) {
                    this.recentPatterns.push({ pattern: patternType, timestamp });
                    // Keep only last 100 patterns
                    if (this.recentPatterns.length > 100) {
                        this.recentPatterns = this.recentPatterns.slice(-100);
                    }
                    const count = this.recentPatterns.filter(p => p.pattern === patternType).length;
                    if (count >= 5) {
                        const existingHabit = this.habits.find(h => h.pattern === patternType);
                        if (existingHabit) {
                            existingHabit.frequency = count;
                            existingHabit.lastSeen = timestamp;
                            existingHabit.confidence = Math.min(1, count / 10);
                            return existingHabit;
                        }
                        else {
                            const newHabit = {
                                id: `habit-${Date.now().toString(36)}`,
                                pattern: patternType,
                                action: `Recognize ${patternType} pattern`,
                                frequency: count,
                                confidence: count / 10,
                                firstSeen: this.recentPatterns.find(p => p.pattern === patternType)?.timestamp || timestamp,
                                lastSeen: timestamp,
                                active: true,
                            };
                            this.habits.push(newHabit);
                            return newHabit;
                        }
                    }
                    return null;
                }
            }
        }
        return null;
    }
    /**
     * Get top skills by proficiency
     */
    getTopSkills(n = 5) {
        return [...this.skills.values()]
            .sort((a, b) => b.proficiency - a.proficiency)
            .slice(0, n);
    }
    /**
     * Get active habits
     */
    getActiveHabits() {
        return this.habits.filter(h => h.active && h.confidence >= 0.5);
    }
    /**
     * Get skill by name
     */
    getSkill(name) {
        return this.skills.get(name);
    }
    /**
     * Get all skills
     */
    getAllSkills() {
        return [...this.skills.values()];
    }
    /**
     * Persist skills and habits to files
     */
    async persist() {
        await this.fileManager.writeFile('skills/proficiency.md', this.formatSkills());
        await this.fileManager.writeFile('skills/habits.md', this.formatHabits());
    }
    // --- Formatting ---
    formatSkills() {
        const sorted = [...this.skills.values()].sort((a, b) => b.proficiency - a.proficiency);
        let content = `# Skill Proficiency
> Auto-managed by AgentBrain Cerebellum
> Last updated: ${new Date().toISOString()}

`;
        for (const skill of sorted) {
            const bar = '█'.repeat(Math.round(skill.proficiency / 5)) + '░'.repeat(20 - Math.round(skill.proficiency / 5));
            content += `## ${skill.name}
- Proficiency: ${bar} ${skill.proficiency.toFixed(0)}/100
- Used: ${skill.timesUsed} times (${skill.successes}✓ / ${skill.failures}✗)
- Success rate: ${(skill.successRate * 100).toFixed(0)}%
- Last used: ${skill.lastUsed}

`;
        }
        return content;
    }
    formatHabits() {
        let content = `# Detected Habits & Patterns
> Auto-managed by AgentBrain Cerebellum
> Last updated: ${new Date().toISOString()}

`;
        for (const habit of this.habits) {
            content += `## ${habit.pattern}
- Action: ${habit.action}
- Frequency: ${habit.frequency} times
- Confidence: ${(habit.confidence * 100).toFixed(0)}%
- Active: ${habit.active}
- First seen: ${habit.firstSeen}
- Last seen: ${habit.lastSeen}

`;
        }
        return content;
    }
    parseSkills(content) {
        const map = new Map();
        const blocks = content.split(/^## /m).slice(1);
        for (const block of blocks) {
            const name = block.split('\n')[0]?.trim();
            if (!name)
                continue;
            const profMatch = block.match(/Proficiency:.*?(\d+)\/100/);
            const usedMatch = block.match(/Used: (\d+) times \((\d+)✓ \/ (\d+)✗\)/);
            const lastMatch = block.match(/Last used: (.+)/);
            const timesUsed = parseInt(usedMatch?.[1] || '0', 10);
            const successes = parseInt(usedMatch?.[2] || '0', 10);
            const failures = parseInt(usedMatch?.[3] || '0', 10);
            map.set(name, {
                id: `skill-${name}`,
                name,
                category: name.split('-')[0] || 'general',
                proficiency: parseInt(profMatch?.[1] || '30', 10),
                timesUsed,
                lastUsed: lastMatch?.[1] || new Date().toISOString(),
                successRate: timesUsed > 0 ? successes / timesUsed : 0,
                successes,
                failures,
            });
        }
        return map;
    }
    parseHabits(content) {
        const habits = [];
        const blocks = content.split(/^## /m).slice(1);
        for (const block of blocks) {
            const pattern = block.split('\n')[0]?.trim();
            if (!pattern)
                continue;
            const freqMatch = block.match(/Frequency: (\d+)/);
            const confMatch = block.match(/Confidence: (\d+)%/);
            const activeMatch = block.match(/Active: (true|false)/);
            habits.push({
                id: `habit-${habits.length}`,
                pattern,
                action: `Proactively prepare for ${pattern} tasks`,
                frequency: parseInt(freqMatch?.[1] || '0', 10),
                confidence: parseInt(confMatch?.[1] || '0', 10) / 100,
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                active: activeMatch?.[1] !== 'false',
            });
        }
        return habits;
    }
}
exports.Cerebellum = Cerebellum;
//# sourceMappingURL=cerebellum.js.map