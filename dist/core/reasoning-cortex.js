"use strict";
/**
 * ReasoningCortex — Brain Whisper System (Phase 6.5 - Enhanced)
 *
 * Provides reasoning hints and suggestions to Aira (the main agent)
 * WITHOUT taking over the thinking process.
 *
 * ENHANCEMENTS (Phase 6.5):
 * 1. Context-Aware: Time pressure, data availability, urgency detection
 * 2. Smart Heuristics: Task-specific adaptive hints
 * 3. Self-Learning: Outcome tracking + effectiveness scoring
 * 4. Token Budget: Adaptive whisper length based on context size
 *
 * Brain's role: Internal assistant that whispers hints
 * Aira's role: Main agent that decides and responds
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReasoningCortex = void 0;
const reasoning_playbooks_js_1 = require("./reasoning-playbooks.js");
// ============================================================================
// ReasoningCortex Class
// ============================================================================
class ReasoningCortex {
    config;
    hippocampus;
    temporal;
    /** Outcome tracking for self-learning */
    outcomes = [];
    maxOutcomeHistory = 100;
    /** Heuristics library for different task types (ENHANCED) */
    HEURISTICS = {
        'market-data': {
            fast: [
                'Use live market data only',
                'Verify token identity before quoting price',
                'Prefer the strongest-liquidity relevant pair',
            ],
            thorough: [
                'Identify symbol/name/contract and possible ticker collisions',
                'Use live DEX/CEX sources and compare relevant pairs',
                'Check liquidity, volume, quote asset, and timestamp',
                'Report uncertainty if sources or token identity conflict',
            ],
            cautions: [
                'Do not use cached memory as current price',
                'Ticker collisions can produce the wrong asset',
                'Thin liquidity can distort price',
            ],
            approach: {
                fast: 'Identify asset -> live price source -> verify pair -> timestamped answer',
                thorough: 'Disambiguate asset, query live sources, rank pairs by relevance/liquidity, cross-check, then answer with timestamp',
            },
        },
        'factual-lookup': {
            fast: [
                'Quick web search 1-2 reliable sources',
                'State if data is recent or outdated',
            ],
            thorough: [
                'Use multiple search queries for better coverage',
                'Cross-reference information from different sources',
                'Check memory for past similar queries',
                'Verify facts before presenting',
            ],
            cautions: [
                'Watch for hallucination risk',
                'Outdated information may exist',
                'Some sources may be biased',
            ],
            approach: {
                fast: 'Memory check → web search → quick verify',
                thorough: 'Query memory first, then web search with diverse queries, verify facts',
            },
        },
        'planning': {
            fast: [
                'Outline key phases quickly',
                'List critical milestones only',
                'Note obvious risks',
            ],
            thorough: [
                'Break into clear phases/milestones',
                'Identify dependencies between tasks',
                'Estimate time/effort realistically',
                'List risks and mitigations',
            ],
            cautions: [
                'Avoid overcommitting on timelines',
                'Hidden dependencies may exist',
                'Requirements may change',
            ],
            approach: {
                fast: 'Structure → key milestones → top risks',
                thorough: 'Decompose into phases, map dependencies, estimate effort, identify risks',
            },
        },
        'troubleshooting': {
            fast: [
                'Check obvious causes first',
                'Look for recent changes',
                'Test quick hypothesis',
            ],
            thorough: [
                'Reproduce the issue first',
                'Check logs and error messages',
                'Isolate root cause before fixing',
                'Test fix before confirming',
            ],
            cautions: [
                'Assumptions can mislead',
                'Multiple root causes possible',
                'Side effects from quick fixes',
            ],
            approach: {
                fast: 'Recent changes → obvious causes → quick test',
                thorough: 'Confirm symptoms, check recent changes, isolate cause, test hypothesis',
            },
        },
        'creative': {
            fast: [
                'Draft outline first',
                'Write quickly, polish later',
            ],
            thorough: [
                'Explore multiple approaches',
                'Consider user context/constraints',
                'Iterate based on feedback',
            ],
            cautions: [
                'Avoid over-engineering',
                'Stay aligned with user goals',
            ],
            approach: {
                fast: 'Outline → draft → quick polish',
                thorough: 'Brainstorm options, evaluate trade-offs, propose best fit',
            },
        },
        'casual': {
            fast: ['Keep response warm and natural'],
            thorough: ['Keep response warm and natural'],
            cautions: [],
            approach: {
                fast: undefined,
                thorough: undefined,
            },
        },
        'unknown': {
            fast: [
                'Clarify intent if needed',
                'Use available memory cautiously',
            ],
            thorough: [
                'Identify the user intent before answering',
                'Use relevant memory but verify assumptions',
                'Ask a concise clarification if the task remains ambiguous',
            ],
            cautions: [
                'Intent may be ambiguous',
                'Memory may not fully answer the request',
            ],
            approach: {
                fast: 'Intent check -> memory check -> concise answer',
                thorough: 'Identify intent, compare memory against the request, then answer or clarify',
            },
        },
    };
    constructor(config, hippocampus, temporal) {
        this.config = config;
        this.hippocampus = hippocampus;
        this.temporal = temporal;
    }
    /**
     * Main entry point: Generate whisper for Aira (ENHANCED)
     */
    async generateWhisper(context) {
        const startTime = Date.now();
        const whisperId = `w-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        try {
            // 1. Analyze task (enhanced with urgency + time sensitivity)
            const taskAnalysis = this.analyzeTask(context.userMessage, context);
            const playbooks = (0, reasoning_playbooks_js_1.matchReasoningPlaybooks)(context.userMessage);
            // 2. Detect time pressure
            const timePressure = this.detectTimePressure(context);
            if (this.config.reasoningWhisper?.enabled === false) {
                return this.createEmptyWhisper(whisperId, taskAnalysis, timePressure, 0);
            }
            // 3. Calculate adaptive token budget
            const tokenBudget = this.calculateTokenBudget(context, taskAnalysis);
            if (tokenBudget <= 0) {
                return this.createEmptyWhisper(whisperId, taskAnalysis, timePressure, 0);
            }
            // 4. Query relevant memories (skip if urgent + time pressure)
            const memories = (timePressure && timePressure < 30 && taskAnalysis.urgency === 'critical')
                ? []
                : await this.queryRelevantMemories(context.userMessage, taskAnalysis, tokenBudget);
            // 5. Assess confidence
            const confidence = this.assessConfidence(taskAnalysis, memories);
            // 6. Choose private thinking depth
            const thinkingMode = this.determineThinkingMode(taskAnalysis, confidence, timePressure);
            // 7. Generate adaptive suggestions (fast vs thorough)
            const suggestions = this.generateAdaptiveSuggestions(taskAnalysis, confidence, timePressure, tokenBudget, playbooks);
            // 8. Generate a reasoning scaffold and quality gates
            const reasoningFrame = this.generateReasoningFrame(taskAnalysis, confidence, memories, thinkingMode, playbooks);
            const verificationChecks = this.generateVerificationChecks(taskAnalysis, confidence, thinkingMode, playbooks);
            const sourcePlan = this.generateSourcePlan(playbooks);
            const answerContract = this.generateAnswerContract(playbooks);
            const evidenceRules = this.generateEvidenceRules(playbooks);
            const recoverySteps = this.generateRecoverySteps(playbooks);
            const uncertaintySignals = this.detectUncertaintySignals(context.userMessage, taskAnalysis, confidence, memories, playbooks);
            // 9. Generate cautions (skip if simple + high confidence)
            const cautions = this.generateCautions(taskAnalysis, confidence, playbooks);
            // 10. Get suggested approach (adaptive)
            const approach = this.getSuggestedApproach(taskAnalysis, timePressure, playbooks);
            const whisper = {
                whisperId,
                supportRole: 'advisor-only',
                thinkingMode,
                taskType: taskAnalysis.type,
                complexity: taskAnalysis.complexity,
                urgency: taskAnalysis.urgency,
                timePressure,
                relevantMemories: memories,
                confidence: confidence.overall,
                knowledgeAvailable: confidence.hasKnowledge,
                suggestions,
                playbookIds: playbooks.map((playbook) => playbook.id),
                reasoningFrame,
                verificationChecks,
                sourcePlan,
                answerContract,
                evidenceRules,
                recoverySteps,
                uncertaintySignals,
                cautions,
                suggestedApproach: approach,
                handoffDirective: 'Use as private support only; Aira/OpenClaw owns the final reasoning, wording, and action.',
                advisorModel: this.getAdvisorModelHint(),
                tokenBudget,
            };
            // 9. Track whisper for self-learning
            this.trackWhisper(whisperId, taskAnalysis, suggestions, startTime);
            return whisper;
        }
        catch (error) {
            console.error('[ReasoningCortex] Error generating whisper:', error);
            // Fallback: return minimal whisper
            return {
                whisperId,
                supportRole: 'advisor-only',
                thinkingMode: 'balanced',
                taskType: 'unknown',
                complexity: 'medium',
                urgency: 'normal',
                relevantMemories: [],
                confidence: 0.5,
                knowledgeAvailable: false,
                suggestions: [],
                playbookIds: [],
                reasoningFrame: [],
                verificationChecks: ['State uncertainty instead of inventing missing facts'],
                sourcePlan: [],
                answerContract: [],
                evidenceRules: [],
                recoverySteps: [],
                uncertaintySignals: ['reasoning cortex fallback'],
                cautions: [],
                handoffDirective: 'Use as private support only; Aira/OpenClaw owns the final reasoning, wording, and action.',
                advisorModel: this.getAdvisorModelHint(),
                tokenBudget: 100,
            };
        }
    }
    /**
     * Return a no-op whisper when the feature is disabled or the token budget is zero.
     */
    createEmptyWhisper(whisperId, analysis, timePressure, tokenBudget) {
        return {
            whisperId,
            supportRole: 'advisor-only',
            thinkingMode: 'quick',
            taskType: analysis.type,
            complexity: analysis.complexity,
            urgency: analysis.urgency,
            timePressure,
            relevantMemories: [],
            confidence: 0,
            knowledgeAvailable: false,
            suggestions: [],
            playbookIds: [],
            reasoningFrame: [],
            verificationChecks: [],
            sourcePlan: [],
            answerContract: [],
            evidenceRules: [],
            recoverySteps: [],
            uncertaintySignals: [],
            cautions: [],
            handoffDirective: 'Use as private support only; Aira/OpenClaw owns the final reasoning, wording, and action.',
            advisorModel: this.getAdvisorModelHint(),
            tokenBudget,
        };
    }
    getAdvisorModelHint() {
        const advisor = this.config.advisorModel;
        if (!advisor || advisor.enabled === false)
            return undefined;
        return {
            enabled: true,
            provider: advisor.provider || 'qwen',
            model: advisor.model || 'Qwen3-4B',
            role: 'verifier-only',
            maxTokens: advisor.maxTokens ?? 256,
        };
    }
    // ==========================================================================
    // PHASE 6.5 ENHANCEMENT 1: Context-Aware Detection
    // ==========================================================================
    /**
     * Detect time pressure from context
     */
    detectTimePressure(context) {
        if (!context.timeoutSeconds && !context.elapsedSeconds) {
            return undefined;
        }
        const timeout = context.timeoutSeconds || Infinity;
        const elapsed = context.elapsedSeconds || 0;
        const remaining = timeout - elapsed;
        return remaining > 0 ? remaining : 0;
    }
    /**
     * Detect urgency from message content
     */
    detectUrgency(message) {
        const msg = message.toLowerCase();
        // Critical urgency patterns
        if (/urgent|asap|emergency|critical|ngay|gấp|khẩn cấp/.test(msg)) {
            return 'critical';
        }
        // High urgency patterns
        if (/quick|fast|nhanh|soon|sớm|immediately/.test(msg)) {
            return 'high';
        }
        // Low urgency patterns
        if (/later|when you can|không vội|từ từ|khi nào rảnh/.test(msg)) {
            return 'low';
        }
        return 'normal';
    }
    // ==========================================================================
    // PHASE 6.5 ENHANCEMENT 2: Smart Heuristics
    // ==========================================================================
    /**
     * Generate adaptive suggestions based on time pressure and context
     */
    generateAdaptiveSuggestions(analysis, confidence, timePressure, tokenBudget, playbooks = []) {
        const heuristic = this.HEURISTICS[analysis.type];
        if (!heuristic)
            return [];
        // Determine mode: fast vs thorough
        const useFastMode = (timePressure !== undefined && timePressure < 60) ||
            analysis.urgency === 'critical' ||
            analysis.urgency === 'high' ||
            tokenBudget < 150;
        const suggestions = useFastMode
            ? heuristic.fast || heuristic.thorough
            : heuristic.thorough;
        const trainedSuggestions = this.prioritizePlaybookHints(this.unique(playbooks.flatMap((playbook) => playbook.suggestions)), playbooks, ['authentic and lived-in', 'working artifact', 'desktop and mobile']);
        // If low confidence, emphasize verification (but keep it short in fast mode)
        if (confidence.overall < 0.5) {
            const verifyHint = useFastMode
                ? 'Quick verify facts'
                : 'Verify information carefully';
            return [
                verifyHint,
                ...trainedSuggestions.slice(0, useFastMode ? 1 : 2),
                ...suggestions.slice(0, useFastMode ? 1 : 2),
            ].slice(0, useFastMode ? 3 : 5);
        }
        // Learn from past outcomes and adjust suggestions
        const effectiveSuggestions = this.getEffectiveSuggestions(analysis.type);
        if (effectiveSuggestions.length > 0) {
            // Mix learned suggestions with default heuristics
            return [
                ...trainedSuggestions.slice(0, 2),
                ...effectiveSuggestions.slice(0, 1),
                ...suggestions.slice(0, 2),
            ].slice(0, useFastMode ? 3 : 5);
        }
        // Return top suggestions based on mode
        return [
            ...trainedSuggestions.slice(0, useFastMode ? 2 : 3),
            ...suggestions.slice(0, useFastMode ? 2 : 3),
        ].slice(0, useFastMode ? 3 : 5);
    }
    /**
     * Get suggested approach (adaptive based on time pressure)
     */
    getSuggestedApproach(analysis, timePressure, playbooks = []) {
        const trainedApproach = playbooks.find((playbook) => playbook.approach)?.approach;
        if (trainedApproach)
            return trainedApproach;
        const heuristic = this.HEURISTICS[analysis.type];
        if (!heuristic)
            return undefined;
        const useFastMode = (timePressure !== undefined && timePressure < 60) ||
            analysis.urgency === 'critical' ||
            analysis.urgency === 'high';
        const approachObj = heuristic.approach;
        if (typeof approachObj === 'object') {
            return useFastMode ? approachObj.fast : approachObj.thorough;
        }
        return approachObj;
    }
    /**
     * Pick how much private cognitive scaffolding Aira needs for this turn.
     */
    determineThinkingMode(analysis, confidence, timePressure) {
        const urgent = analysis.urgency === 'critical' ||
            analysis.urgency === 'high' ||
            (timePressure !== undefined && timePressure < 60);
        if (urgent) {
            return 'quick';
        }
        if (analysis.type === 'creative' && analysis.complexity !== 'simple') {
            return 'reflective';
        }
        if (analysis.complexity === 'complex') {
            return confidence.overall < 0.55 ? 'reflective' : 'deep';
        }
        if (analysis.type === 'unknown' || confidence.overall < 0.45) {
            return 'reflective';
        }
        if (analysis.complexity === 'simple' && analysis.type === 'casual') {
            return 'quick';
        }
        return 'balanced';
    }
    /**
     * Generate compact private reasoning structure without exposing chain-of-thought.
     */
    generateReasoningFrame(analysis, confidence, memories, thinkingMode, playbooks = []) {
        const frame = this.unique(playbooks.flatMap((playbook) => playbook.reasoningFrame));
        switch (analysis.type) {
            case 'market-data':
                frame.push('Disambiguate asset identity, live source, pair quality, and timestamp before answering');
                frame.push('Do not use memory as current price; memory can only suggest where to look');
                break;
            case 'factual-lookup':
                frame.push('Separate known facts, missing facts, and current-source checks');
                frame.push('Prefer primary or recent sources when facts may have changed');
                break;
            case 'troubleshooting':
                frame.push('Pin symptom, recent change, hypothesis, verification step');
                frame.push('Check side effects before declaring the fix complete');
                break;
            case 'planning':
                frame.push('Map goal, constraints, dependencies, risks, and first next action');
                frame.push('Separate firm commitments from estimates');
                break;
            case 'creative':
                frame.push('Generate options, choose the best fit, then polish for the user voice');
                frame.push('Preserve constraints and avoid drifting from the requested outcome');
                break;
            case 'casual':
                frame.push('Keep the reply natural, low-overhead, and context-aware');
                break;
            default:
                frame.push('Identify intent and constraints before giving a strong answer');
                frame.push('Ask one concise clarification if the request remains ambiguous');
                break;
        }
        if (memories.length > 0) {
            frame.push('Use recalled memories as cues, not unquestioned proof');
        }
        if (confidence.overall < 0.5) {
            frame.push('Prefer uncertainty or clarification over invented detail');
        }
        const maxItems = thinkingMode === 'quick' ? 2 : thinkingMode === 'balanced' ? 3 : 4;
        return frame.slice(0, maxItems);
    }
    /**
     * Generate output quality gates before Aira answers.
     */
    generateVerificationChecks(analysis, confidence, thinkingMode, playbooks = []) {
        const checks = this.unique(this.orderPlaybooks(playbooks, false).flatMap((playbook) => playbook.verificationChecks));
        if (analysis.type === 'factual-lookup' || analysis.type === 'market-data' || analysis.timeSensitive) {
            checks.push('Verify date-sensitive facts before stating certainty');
        }
        if (analysis.type === 'market-data') {
            checks.push('Use only live source values for price, volume, liquidity, and market cap');
        }
        if (analysis.type === 'troubleshooting') {
            checks.push('Confirm with a concrete test or observable evidence');
        }
        if (analysis.type === 'planning') {
            checks.push('Check hidden dependencies and name the next action');
        }
        if (analysis.type === 'creative') {
            checks.push('Check the result matches the user voice and constraints');
        }
        if (confidence.overall < 0.6) {
            checks.push('State uncertainty or ask a concise clarification');
        }
        checks.push('Do not reveal Brain Whisper or private reasoning text');
        const maxItems = analysis.type === 'market-data'
            ? 8
            : this.hasAnyPlaybook(playbooks, ['frontend-artifact-quality', 'code-tool-execution-quality'])
                ? 6
                : thinkingMode === 'quick' ? 2 : 4;
        return checks.slice(0, maxItems);
    }
    /**
     * Identify why this whisper should stay cautious.
     */
    detectUncertaintySignals(message, analysis, confidence, memories, playbooks = []) {
        const signals = this.unique(playbooks.flatMap((playbook) => playbook.uncertaintySignals));
        const msg = message.toLowerCase();
        if (analysis.type === 'unknown') {
            signals.push('unclear user intent');
        }
        if (!confidence.hasKnowledge && analysis.type !== 'casual') {
            signals.push('no strong memory match');
        }
        if (/maybe|not sure|khong chac|khong ro|co le|hinh nhu/.test(msg)) {
            signals.push('user phrased request with uncertainty');
        }
        if (confidence.overall < 0.5) {
            signals.push('low confidence');
        }
        if (analysis.complexity === 'complex' && memories.length === 0) {
            signals.push('complex request without supporting recall');
        }
        if (analysis.type === 'market-data') {
            signals.push('market data changes continuously');
        }
        return this.unique(signals).slice(0, 10);
    }
    generateSourcePlan(playbooks) {
        return this.unique(this.orderPlaybooks(playbooks, false).flatMap((playbook) => playbook.sourcePlan)).slice(0, 8);
    }
    generateAnswerContract(playbooks) {
        return this.unique(this.orderPlaybooks(playbooks, false).flatMap((playbook) => playbook.answerContract)).slice(0, 7);
    }
    generateEvidenceRules(playbooks) {
        const genericFirst = !this.hasAnyPlaybook(playbooks, [
            'frontend-artifact-quality',
            'code-tool-execution-quality',
        ]);
        return this.unique(this.orderPlaybooks(playbooks, genericFirst).flatMap((playbook) => playbook.evidenceRules || [])).slice(0, 18);
    }
    generateRecoverySteps(playbooks) {
        const genericFirst = !this.hasAnyPlaybook(playbooks, [
            'frontend-artifact-quality',
            'code-tool-execution-quality',
        ]);
        return this.unique(this.orderPlaybooks(playbooks, genericFirst).flatMap((playbook) => playbook.recoverySteps || [])).slice(0, 12);
    }
    hasPlaybook(playbooks, id) {
        return playbooks.some((playbook) => playbook.id === id);
    }
    hasAnyPlaybook(playbooks, ids) {
        return ids.some((id) => this.hasPlaybook(playbooks, id));
    }
    prioritizePlaybookHints(hints, playbooks, prioritySubstrings) {
        if (!this.hasPlaybook(playbooks, 'frontend-artifact-quality')) {
            return hints;
        }
        const prioritized = prioritySubstrings.flatMap((substring) => hints.filter((hint) => hint.toLowerCase().includes(substring.toLowerCase())));
        return this.unique([...prioritized, ...hints]);
    }
    orderPlaybooks(playbooks, genericFirst) {
        const generic = playbooks.filter((playbook) => playbook.id === 'evidence-triangulation-live');
        const specific = playbooks
            .filter((playbook) => playbook.id !== 'evidence-triangulation-live')
            .sort((left, right) => this.playbookSpecificity(left) - this.playbookSpecificity(right));
        return genericFirst ? [...generic, ...specific] : [...specific, ...generic];
    }
    playbookSpecificity(playbook) {
        if (playbook.id === 'market-token-price-live')
            return 1;
        if (playbook.id === 'evidence-triangulation-live')
            return 2;
        return 0;
    }
    unique(items) {
        return Array.from(new Set(items.filter((item) => item && item.trim())));
    }
    // ==========================================================================
    // PHASE 6.5 ENHANCEMENT 3: Self-Learning
    // ==========================================================================
    /**
     * Track whisper for outcome learning
     */
    trackWhisper(whisperId, analysis, suggestions, startTime) {
        const outcome = {
            whisperId,
            taskType: analysis.type,
            suggestions,
            success: true, // Will be updated when outcome is known
            timeTaken: Date.now() - startTime,
            timestamp: Date.now(),
        };
        this.outcomes.push(outcome);
        // Keep only recent outcomes
        if (this.outcomes.length > this.maxOutcomeHistory) {
            this.outcomes.shift();
        }
    }
    /**
     * Get effective suggestions based on past outcomes
     */
    getEffectiveSuggestions(taskType) {
        const relevantOutcomes = this.outcomes.filter(o => o.taskType === taskType && o.success && o.userSatisfaction && o.userSatisfaction > 0.7);
        if (relevantOutcomes.length < 3) {
            return [];
        }
        // Count suggestion frequency in successful outcomes
        const suggestionCounts = new Map();
        for (const outcome of relevantOutcomes) {
            for (const suggestion of outcome.suggestions) {
                suggestionCounts.set(suggestion, (suggestionCounts.get(suggestion) || 0) + 1);
            }
        }
        // Return top suggestions by frequency
        return Array.from(suggestionCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([suggestion]) => suggestion);
    }
    /**
     * Record outcome for learning (called externally after task completion)
     */
    recordOutcome(whisperId, success, userSatisfaction) {
        const outcome = this.outcomes.find(o => o.whisperId === whisperId);
        if (outcome) {
            outcome.success = success;
            outcome.userSatisfaction = userSatisfaction;
        }
    }
    // ==========================================================================
    // PHASE 6.5 ENHANCEMENT 4: Token Budget Management
    // ==========================================================================
    /**
     * Calculate adaptive token budget for whisper
     */
    calculateTokenBudget(context, analysis) {
        // Skip whisper entirely for casual tasks if context is large
        if (analysis.type === 'casual' && context.contextTokens && context.contextTokens > 80000) {
            return 0;
        }
        // Base budget
        let budget = 200;
        // Reduce if context is already large
        if (context.contextTokens) {
            if (context.contextTokens > 100000) {
                budget = 100; // Minimal whisper for large context
            }
            else if (context.contextTokens > 50000) {
                budget = 150;
            }
        }
        // Reduce for simple tasks
        if (analysis.complexity === 'simple') {
            budget = Math.floor(budget * 0.6);
        }
        // Reduce in fast mode
        if (analysis.urgency === 'critical' || analysis.urgency === 'high') {
            budget = Math.floor(budget * 0.7);
        }
        if (analysis.type === 'market-data') {
            budget = Math.max(budget, 420);
        }
        const intentText = this.normalizeIntentText(context.userMessage);
        const frontendArtifactRequested = /(landing|frontend|website|web site|webapp|web app|html|css|ui|responsive|mobile|desktop|component|page|trang|trang web|giao dien|ung dung web)/i.test(intentText) &&
            /(create|build|generate|design|write|code|implement|prototype|render|test|verify|check|real|authentic|lived-in|alive|polished|tao|xay dung|thiet ke|viet|lap trinh|mo|kiem tra|kiem|xem|that|thuc te|song dong|giong ai|kieu ai|nhin ai|qua ai)/i.test(intentText);
        if (frontendArtifactRequested) {
            budget = Math.max(budget, 560);
        }
        const codeToolRequested = /(code|tool|command|script|test|build|plugin|api|hook|file|repo|debug|fix|bug|cong cu|lenh|ma nguon|tap tin|tep|sua bug)/i.test(intentText) &&
            /(run|execute|inspect|verify|check|fix|debug|build|test|edit|patch|report|chay|kiem tra|kiem|xac minh|sua|doc|bao cao)/i.test(intentText);
        if (codeToolRequested) {
            budget = Math.max(budget, 300);
        }
        const configuredMax = this.config.reasoningWhisper?.maxTokens;
        if (configuredMax !== undefined) {
            if (configuredMax <= 0) {
                return 0;
            }
            budget = Math.min(budget, configuredMax);
        }
        const minBudget = configuredMax !== undefined && configuredMax < 50 ? configuredMax : 50;
        return Math.max(minBudget, budget);
    }
    /**
     * Query relevant memories (ENHANCED with token budget awareness)
     */
    async queryRelevantMemories(message, analysis, tokenBudget) {
        // Skip memory query if token budget is too low
        if (tokenBudget < 100) {
            return [];
        }
        const memories = [];
        const maxMemories = tokenBudget < 150 ? 3 : 5;
        try {
            // Query semantic memory (facts, knowledge)
            const semanticResults = await this.hippocampus.recall(message, 'semantic');
            for (const mem of semanticResults.slice(0, 2)) {
                if (mem.confidence > 0.6) {
                    const maxLength = tokenBudget < 150 ? 50 : 80;
                    const content = mem.content.slice(0, maxLength);
                    memories.push(`[Knowledge: ${content}${content.length === maxLength ? '...' : ''}]`);
                }
            }
            // Query episodic memory (past experiences) - only if budget allows
            if (tokenBudget >= 150) {
                const episodicResults = await this.hippocampus.recall(message, 'episodic');
                for (const mem of episodicResults.slice(0, 2)) {
                    if (mem.confidence > 0.6) {
                        const content = mem.content.slice(0, 80);
                        memories.push(`[Experience: ${content}${content.length === 80 ? '...' : ''}]`);
                    }
                }
            }
        }
        catch (error) {
            console.error('[ReasoningCortex] Memory query error:', error);
        }
        return memories.slice(0, maxMemories);
    }
    // ==========================================================================
    // Task Analysis (ENHANCED)
    // ==========================================================================
    /**
     * Analyze task type and complexity from user message (ENHANCED)
     */
    normalizeIntentText(message) {
        return message
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .toLowerCase();
    }
    analyzeTask(message, context) {
        const msg = `${message.toLowerCase()} ${this.normalizeIntentText(message)}`;
        const marketDataPatterns = [
            /(gia|price|chart|volume|liquidity|thanh khoan|market cap|mcap|fdv)/i,
            /(giá|gia|price|chart|volume|liquidity|thanh khoản|market cap|mcap|fdv)/i,
            /(token|coin|dex|pair|contract|ticker|symbol|prl|wprl|pearl)/i,
        ];
        // Factual lookup patterns
        const factualPatterns = [
            /check|tim|search|research|find|look up|kiem tra|xac minh|nguon/i,
            /check|tìm|search|research|find|look up|kiểm tra/i,
            /\bwhat\b|\bwhich\b|\bwho\b|\bwhen\b|\bwhere\b|\bdoes\b|\bdo we\b|\bdid\b|\bis\b|\bare\b/i,
            /tin tức|news|airdrop|hackathon/i,
            /thông tin|info|data|stats|status|giá|price/i,
        ];
        // Creative patterns
        const creativePatterns = [
            /viet|write|tao|create|design|generate|thiet ke/i,
            /viết|write|tạo|create|design|generate/i,
            /ý tưởng|idea|brainstorm|thread|tweet|bài/i,
        ];
        // Planning patterns
        const planningPatterns = [
            /plan|ke hoach|roadmap|timeline|schedule/i,
            /nang cap|upgrade|improve|optimize/i,
            /tien hanh|implement|build|launch/i,
            /plan|kế hoạch|roadmap|timeline|schedule/i,
            /nâng cấp|upgrade|improve|optimize/i,
            /tiến hành|implement|build|launch/i,
        ];
        // Troubleshooting patterns
        const troubleshootingPatterns = [
            /fix|debug|error|loi|sua|problem|issue/i,
            /tai sao|why|how come|khong hoat dong|cham|slow/i,
            /fix|debug|error|lỗi|sửa|problem|issue/i,
            /tại sao|why|how come|không hoạt động|chậm|slow/i,
        ];
        // Casual patterns
        const casualPatterns = [
            /^(hi|hello|chao|gm|good morning|good night|bye)/i,
            /^(cam on|thanks|thank you|ok|oke|okay)/i,
            /^(hi|hello|chào|gm|good morning|good night|bye)/i,
            /^(cảm ơn|thanks|thank you|ok|oke|okay)/i,
        ];
        const frontendArtifactIntent = /(landing|frontend|website|web site|webapp|web app|html|css|ui|responsive|mobile|desktop|component|page|trang|trang web|giao dien|ung dung web)/i.test(msg) &&
            /(create|build|generate|design|write|code|implement|prototype|render|test|verify|check|real|authentic|lived-in|alive|polished|tao|xay dung|thiet ke|viet|lap trinh|mo|kiem tra|kiem|xem|that|thuc te|song dong|giong ai|kieu ai|nhin ai|qua ai)/i.test(msg);
        const codeToolIntent = /(code|tool|command|script|test|build|plugin|api|hook|file|repo|debug|fix|bug|cong cu|lenh|ma nguon|tap tin|tep|sua bug)/i.test(msg) &&
            /(run|execute|inspect|verify|check|fix|debug|build|test|edit|patch|report|chay|kiem tra|kiem|xac minh|sua|doc|bao cao)/i.test(msg);
        // Classify task type
        let type = 'unknown';
        if (marketDataPatterns.every(p => p.test(msg))) {
            type = 'market-data';
        }
        else if (frontendArtifactIntent) {
            type = 'creative';
        }
        else if (codeToolIntent) {
            type = 'troubleshooting';
        }
        else if (factualPatterns.some(p => p.test(msg))) {
            type = 'factual-lookup';
        }
        else if (planningPatterns.some(p => p.test(msg))) {
            type = 'planning';
        }
        else if (creativePatterns.some(p => p.test(msg))) {
            type = 'creative';
        }
        else if (troubleshootingPatterns.some(p => p.test(msg))) {
            type = 'troubleshooting';
        }
        else if (casualPatterns.some(p => p.test(msg))) {
            type = 'casual';
        }
        // Estimate complexity
        const wordCount = message.split(/\s+/).length;
        const hasMultipleQuestions = (message.match(/\?/g) || []).length > 1;
        const hasMultipleTasks = /va|and|then|sau do|roi/.test(msg);
        let complexity = 'simple';
        if (wordCount > 30 || hasMultipleQuestions || hasMultipleTasks) {
            complexity = 'complex';
        }
        else if (wordCount > 10) {
            complexity = 'medium';
        }
        if (type === 'market-data' && complexity === 'simple') {
            complexity = 'medium';
        }
        // Detect urgency
        const urgency = this.detectUrgency(message);
        // Detect time sensitivity
        const timeSensitive = type === 'market-data' ||
            urgency !== 'normal' && urgency !== 'low' ||
            /(today|now|current|latest|hien tai|bay gio|moi nhat|gia|price|market)/i.test(msg);
        // Extract keywords (simple approach)
        const keywords = message
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 3)
            .slice(0, 5);
        return {
            type,
            complexity,
            urgency,
            requiredKnowledge: [],
            keywords,
            timeSensitive,
        };
    }
    // ==========================================================================
    // Confidence Assessment
    // ==========================================================================
    /**
     * Assess confidence based on available knowledge and task familiarity
     */
    assessConfidence(analysis, memories) {
        // Knowledge availability score (0-1)
        const knowledgeScore = memories.length > 0
            ? Math.min(1, memories.length / 3)
            : 0;
        // Task familiarity score (based on task type + past outcomes)
        const baseFamiliarity = {
            'factual-lookup': 0.8,
            'market-data': 0.65,
            'troubleshooting': 0.7,
            'planning': 0.75,
            'creative': 0.6,
            'casual': 0.9,
            'unknown': 0.4,
        };
        // Adjust familiarity based on past success rate
        const successRate = this.getSuccessRate(analysis.type);
        const familiarityScore = successRate > 0
            ? (baseFamiliarity[analysis.type] * 0.6 + successRate * 0.4)
            : baseFamiliarity[analysis.type];
        // Complexity penalty
        const complexityPenalty = {
            'simple': 0,
            'medium': -0.1,
            'complex': -0.2,
        }[analysis.complexity];
        // Overall confidence (weighted average)
        const overall = Math.max(0, Math.min(1, knowledgeScore * 0.4 +
            familiarityScore * 0.6 +
            complexityPenalty));
        return {
            overall,
            hasKnowledge: memories.length > 0,
        };
    }
    /**
     * Get success rate for a task type from past outcomes
     */
    getSuccessRate(taskType) {
        const relevantOutcomes = this.outcomes.filter(o => o.taskType === taskType);
        if (relevantOutcomes.length < 3) {
            return 0; // Not enough data
        }
        const successCount = relevantOutcomes.filter(o => o.success).length;
        return successCount / relevantOutcomes.length;
    }
    // ==========================================================================
    // Caution Generation
    // ==========================================================================
    /**
     * Generate cautions based on task type and confidence
     */
    generateCautions(analysis, confidence, playbooks = []) {
        const heuristic = this.HEURISTICS[analysis.type];
        if (!heuristic && playbooks.length === 0)
            return [];
        // Only show cautions if:
        // - Complexity is medium/high, OR
        // - Confidence is low, OR
        // - Task type has known risks
        const shouldShowCautions = analysis.complexity !== 'simple' ||
            confidence.overall < 0.7 ||
            (heuristic?.cautions.length || 0) > 0 ||
            playbooks.length > 0;
        if (!shouldShowCautions) {
            return [];
        }
        // Show fewer cautions in fast/urgent mode
        const hasFrontendPlaybook = this.hasPlaybook(playbooks, 'frontend-artifact-quality');
        const maxCautions = analysis.type === 'market-data'
            ? 7
            : hasFrontendPlaybook ? 5
                : analysis.urgency === 'critical' || analysis.urgency === 'high' ? 1 : 2;
        const cautions = this.unique([
            ...this.orderPlaybooks(playbooks, false).flatMap((playbook) => playbook.cautions),
            ...(heuristic?.cautions || []),
        ]);
        return this.prioritizePlaybookHints(cautions, playbooks, ['generic AI template', 'Over-clean dashboards', 'verified working page']).slice(0, maxCautions + (playbooks.length > 0 ? 1 : 0));
    }
    // ==========================================================================
    // Metrics & Analytics
    // ==========================================================================
    /**
     * Get whisper statistics
     */
    getStatistics() {
        const total = this.outcomes.length;
        const successful = this.outcomes.filter(o => o.success).length;
        const avgTime = total > 0
            ? this.outcomes.reduce((sum, o) => sum + o.timeTaken, 0) / total
            : 0;
        const breakdown = {};
        for (const outcome of this.outcomes) {
            breakdown[outcome.taskType] = (breakdown[outcome.taskType] || 0) + 1;
        }
        return {
            totalWhispers: total,
            successRate: total > 0 ? successful / total : 0,
            avgTimeTaken: avgTime,
            taskTypeBreakdown: breakdown,
        };
    }
}
exports.ReasoningCortex = ReasoningCortex;
//# sourceMappingURL=reasoning-cortex.js.map