import type { BrainWhisper } from '../core/reasoning-cortex.js';
import { isRichArtifactPlaybookId } from '../core/reasoning-playbooks.js';

/**
 * Format Brain Whisper for private prompt injection.
 */
export function formatWhisper(whisper: BrainWhisper): string {
  if (whisper.tokenBudget <= 0) {
    return '';
  }

  const lines: string[] = ['\n### Brain Whisper (Private support for Aira/OpenClaw)'];

  lines.push('Role: Use as private support only; Aira/OpenClaw owns final answer and action.');
  if (whisper.advisorModel?.enabled) {
    lines.push(
      `Advisor model: ${whisper.advisorModel.model} (${whisper.advisorModel.role}); critique/check only, never final answer.`
    );
  }
  lines.push(`Thinking mode: ${whisper.thinkingMode}`);
  lines.push(`Task detected: ${whisper.taskType}`);

  if (whisper.complexity !== 'simple') {
    lines.push(`Complexity: ${whisper.complexity}`);
  }

  if (whisper.urgency === 'critical' || whisper.urgency === 'high') {
    lines.push(`Urgency: ${whisper.urgency}`);
  }

  if (whisper.timePressure !== undefined && whisper.timePressure < 60) {
    lines.push(`Time pressure: ${whisper.timePressure}s remaining - prioritize speed`);
  }

  lines.push(
    `Confidence: ${(whisper.confidence * 100).toFixed(0)}%${
      whisper.knowledgeAvailable ? ' - knowledge available' : ' - limited knowledge'
    }`
  );

  const primaryFrame = whisper.reasoningFrame[0];
  const frontendArtifact = whisper.playbookIds.some((id) => isRichArtifactPlaybookId(id));
  const suggestionLimit = frontendArtifact ? 3 : 1;
  const primarySuggestions = whisper.suggestions.slice(0, suggestionLimit);
  if (primaryFrame) {
    lines.push(`Reasoning frame: ${primaryFrame}`);
  }
  if (primarySuggestions.length > 0) {
    lines.push(`Suggestion: ${primarySuggestions.join(' | ')}`);
  }

  const marketData = whisper.taskType === 'market-data';
  const verificationLimit = marketData ? 4 : frontendArtifact ? 6 : 2;
  const sourceLimit = marketData ? 3 : frontendArtifact ? 4 : 2;
  const answerLimit = marketData ? 5 : frontendArtifact ? 3 : 2;
  const evidenceLimit = marketData ? 2 : frontendArtifact ? 6 : 3;
  const recoveryLimit = marketData ? 2 : frontendArtifact ? 4 : 2;

  const pushVerification = () => {
    if (whisper.verificationChecks.length > 0) {
      lines.push(`Verification checks: ${whisper.verificationChecks.slice(0, verificationLimit).join(' | ')}`);
    }
  };

  const pushSourcePlan = () => {
    if (whisper.sourcePlan.length > 0) {
      lines.push(`Live-source plan: ${whisper.sourcePlan.slice(0, sourceLimit).join(' | ')}`);
    }
  };

  const pushAnswerContract = () => {
    if (whisper.answerContract.length > 0) {
      lines.push(`Answer must include: ${whisper.answerContract.slice(0, answerLimit).join(' | ')}`);
    }
  };

  const pushEvidenceRules = () => {
    if (whisper.evidenceRules.length > 0) {
      lines.push(`Evidence rules: ${whisper.evidenceRules.slice(0, evidenceLimit).join(' | ')}`);
    }
  };

  const pushRecoverySteps = () => {
    if (whisper.recoverySteps.length > 0) {
      lines.push(`If evidence fails: ${whisper.recoverySteps.slice(0, recoveryLimit).join(' | ')}`);
    }
  };

  if (marketData) {
    pushAnswerContract();
    pushSourcePlan();
    pushEvidenceRules();
    pushRecoverySteps();
    pushVerification();
  } else {
    pushVerification();
    pushEvidenceRules();
    pushRecoverySteps();
    pushSourcePlan();
    pushAnswerContract();
  }

  if (whisper.uncertaintySignals.length > 0) {
    lines.push(`Uncertainty signals: ${whisper.uncertaintySignals.join(' | ')}`);
  }

  if (whisper.cautions.length > 0) {
    lines.push(`Caution: ${whisper.cautions.join('; ')}`);
  }

  if (whisper.suggestedApproach) {
    lines.push(`Approach: ${whisper.suggestedApproach}`);
  }

  if (whisper.relevantMemories.length > 0) {
    lines.push(`Relevant memory: ${whisper.relevantMemories.join('; ')}`);
  }

  const text = lines.join('\n');
  const maxChars = whisper.tokenBudget * 4;
  return text.length > maxChars ? `${text.slice(0, maxChars)}...` : text;
}

export function inferFeedbackOutcome(
  message: string,
  sentiment: number
): { success: boolean; userSatisfaction: number } | null {
  const msg = message.toLowerCase();
  const looksLikePositiveFeedback =
    /\b(thanks|thank you|good job|great|perfect|excellent|nice|well done|correct|right|dung|chuan|cam on)\b/.test(msg);
  const looksLikeNegativeFeedback =
    /\b(wrong|incorrect|bad answer|not correct|not right|you were wrong|failed|sai|khong dung|chua dung)\b/.test(msg);

  if (!looksLikePositiveFeedback && !looksLikeNegativeFeedback) {
    return null;
  }

  const userSatisfaction = Math.max(0, Math.min(1, (sentiment + 1) / 2));
  return {
    success: looksLikePositiveFeedback && !looksLikeNegativeFeedback,
    userSatisfaction,
  };
}

export function getInjectionBudget(reasoningWhisper: string, baseTokens = 250): number {
  if (!reasoningWhisper) {
    return baseTokens;
  }

  const whisperTokens = Math.ceil(reasoningWhisper.length / 4);
  return Math.min(900, baseTokens + whisperTokens);
}
