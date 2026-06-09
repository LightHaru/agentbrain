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

/** Keywords that signal high urgency */
const URGENCY_KEYWORDS = {
  critical: ['scam', 'hack', 'drain', 'rug', 'emergency', 'urgent', 'mất tiền', 'bị hack', 'khẩn cấp'],
  high: ['bug', 'lỗi', 'fix', 'broken', 'down', 'crash', 'deploy', 'production', 'deadline', 'gấp', 'nhanh', 'ngay', 'liền'],
  medium: ['help', 'giúp', 'check', 'review', 'làm', 'tạo', 'build', 'code', 'write'],
};

/** Topic classification patterns */
const TOPIC_PATTERNS: Record<string, RegExp[]> = {
  'status-check': [/xong.*chưa|đâu.*rồi|tới.*đâu|sao.*rồi|progress|status|thế.*nào.*rồi/i],
  crypto: [/token|coin|swap|defi|nft|wallet|ví|trade|long|short|leverage/i],
  coding: [/code|bug|fix|deploy|api|server|database|function|component|build/i],
  content: [/bài|viết|blog|seo|content|article|post|tweet|thread/i],
  research: [/research|tìm hiểu|phân tích|analyze|compare|đánh giá/i],
  ops: [/server|vps|nginx|systemctl|docker|disk|ram|cpu|process/i],
  casual: [/chào|hi|hello|ơi|nè|haha|lol|😂|🤣|vui|buồn/i],
  planning: [/plan|kế hoạch|roadmap|timeline|milestone|phase|sprint/i],
};

/** Emotional tone detection */
const TONE_PATTERNS = {
  positive: [/tốt|hay|đỉnh|ngon|thích|vui|haha|😁|😊|🎉|❤️|cảm ơn|thanks/i],
  negative: [/tệ|dở|ghét|bực|tức|buồn|😢|😤|💢|sai|lỗi|fail/i],
  urgent: [/gấp|nhanh|ngay|liền|asap|khẩn|emergency|!!!|⚠️/i],
};

export class Thalamus {
  private config: BrainConfig;

  constructor(config: BrainConfig) {
    this.config = config;
  }

  /**
   * Classify an incoming message — the first step in every brain cycle
   */
  classify(context: MessageContext): MessageClassification {
    const msg = context.message.toLowerCase();

    return {
      intent: this.detectIntent(msg),
      urgency: this.detectUrgency(msg),
      topic: this.detectTopic(msg),
      emotionalTone: this.detectTone(msg),
      requiresAction: this.requiresAction(msg),
    };
  }

  /**
   * Detect primary intent of the message
   */
  private detectIntent(msg: string): string {
    if (/\?|hỏi|là gì|thế nào|sao|how|what|why|when/.test(msg)) return 'question';
    if (/làm|tạo|build|code|write|viết|deploy|fix/.test(msg)) return 'action_request';
    if (/tìm|search|research|check|xem|kiểm tra/.test(msg)) return 'research';
    if (/nhắc|remind|alarm|cron|schedule|lịch/.test(msg)) return 'reminder';
    if (/ok|ừ|oke|được|đồng ý|yes|confirm|chốt/.test(msg)) return 'confirmation';
    if (/không|no|cancel|hủy|thôi|dừng|stop/.test(msg)) return 'rejection';
    if (/cảm ơn|thanks|thank|tks/.test(msg)) return 'gratitude';
    return 'statement';
  }

  /**
   * Detect urgency level
   * Phase 4: status-check questions default to 'medium', not high
   */
  private detectUrgency(msg: string): 'low' | 'medium' | 'high' | 'critical' {
    // Status check questions are medium by default (not urgent)
    if (/xong.*chưa|đâu.*rồi|tới.*đâu|sao.*rồi|thế.*nào.*rồi/i.test(msg)) {
      // Unless explicit urgency markers present
      if (/gấp|nhanh|ngay|liền|asap/i.test(msg)) return 'high';
      return 'medium';
    }

    for (const keyword of URGENCY_KEYWORDS.critical) {
      if (msg.includes(keyword)) return 'critical';
    }
    for (const keyword of URGENCY_KEYWORDS.high) {
      if (msg.includes(keyword)) return 'high';
    }
    for (const keyword of URGENCY_KEYWORDS.medium) {
      if (msg.includes(keyword)) return 'medium';
    }
    return 'low';
  }

  /**
   * Detect primary topic
   */
  private detectTopic(msg: string): string {
    for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(msg)) return topic;
      }
    }
    return 'general';
  }

  /**
   * Detect emotional tone
   */
  private detectTone(msg: string): 'positive' | 'neutral' | 'negative' | 'urgent' {
    for (const pattern of TONE_PATTERNS.urgent) {
      if (pattern.test(msg)) return 'urgent';
    }
    for (const pattern of TONE_PATTERNS.negative) {
      if (pattern.test(msg)) return 'negative';
    }
    for (const pattern of TONE_PATTERNS.positive) {
      if (pattern.test(msg)) return 'positive';
    }
    return 'neutral';
  }

  /**
   * Determine if message requires agent to take action (vs just respond)
   */
  private requiresAction(msg: string): boolean {
    return /làm|tạo|build|code|fix|deploy|write|viết|tìm|search|check|send|gửi|xóa|delete|update/.test(msg);
  }

  /**
   * Determine which brain modules should be activated for this message
   */
  routeToModules(classification: MessageClassification): string[] {
    const modules: string[] = ['hippocampus']; // always recall memory

    if (classification.urgency === 'critical') {
      modules.push('amygdala'); // safety check
    }

    if (classification.requiresAction) {
      modules.push('prefrontal'); // planning needed
    }

    if (classification.emotionalTone !== 'neutral') {
      modules.push('amygdala'); // emotional processing
    }

    if (classification.intent === 'action_request') {
      modules.push('cerebellum'); // check if we have a learned skill for this
    }

    return [...new Set(modules)];
  }
}
