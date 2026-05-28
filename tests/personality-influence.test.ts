import { describe, it, expect, beforeEach } from 'vitest';
import { PersonalityInfluence } from '../src/core/personality-influence.js';

describe('PersonalityInfluence', () => {
  let influence: PersonalityInfluence;

  beforeEach(() => {
    influence = new PersonalityInfluence({
      warmth: 65,
      directness: 75,
      humor: 55,
      protectiveness: 80,
      curiosity: 60,
      assertiveness: 70,
    });
  });

  describe('generateDirectives', () => {
    it('generates style directives based on traits', () => {
      const result = influence.generateDirectives({
        timeOfDay: 14,
        mood: 'neutral',
        valence: 0,
        arousal: 0.3,
        recentTopics: ['coding'],
        interactionCount: 50,
        trustLevel: 60,
        lastUserSentiment: 0,
      });
      expect(result).toContain('Style:');
      expect(result.length).toBeGreaterThan(10);
    });

    it('adds late-night concern after 2AM', () => {
      const result = influence.generateDirectives({
        timeOfDay: 3,
        mood: 'neutral',
        valence: 0,
        arousal: 0.3,
        recentTopics: [],
        interactionCount: 10,
        trustLevel: 50,
        lastUserSentiment: 0,
      });
      expect(result.toLowerCase()).toContain('late');
    });

    it('adapts to frustrated user', () => {
      const result = influence.generateDirectives({
        timeOfDay: 14,
        mood: 'concerned',
        valence: -0.3,
        arousal: 0.5,
        recentTopics: ['debugging'],
        interactionCount: 30,
        trustLevel: 50,
        lastUserSentiment: -0.5,
      });
      expect(result.toLowerCase()).toMatch(/frustrat|upset|acknowledge/);
    });

    it('is more casual with high trust', () => {
      const result = influence.generateDirectives({
        timeOfDay: 14,
        mood: 'positive',
        valence: 0.3,
        arousal: 0.3,
        recentTopics: [],
        interactionCount: 100,
        trustLevel: 80,
        lastUserSentiment: 0.2,
      });
      expect(result.toLowerCase()).toMatch(/casual|kaomoji|opinion/);
    });

    it('is careful with low trust', () => {
      const result = influence.generateDirectives({
        timeOfDay: 14,
        mood: 'neutral',
        valence: 0,
        arousal: 0.3,
        recentTopics: [],
        interactionCount: 5,
        trustLevel: 15,
        lastUserSentiment: 0,
      });
      expect(result.toLowerCase()).toMatch(/careful|verify|show work/);
    });
  });

  describe('updateTraits', () => {
    it('updates and regenerates directives', () => {
      influence.updateTraits({ warmth: 90, humor: 80 });
      const result = influence.generateDirectives({
        timeOfDay: 14,
        mood: 'positive',
        valence: 0.3,
        arousal: 0.3,
        recentTopics: [],
        interactionCount: 20,
        trustLevel: 50,
        lastUserSentiment: 0,
      });
      expect(result.toLowerCase()).toMatch(/warm|caring|kaomoji/);
    });
  });

  describe('getTraitSummary', () => {
    it('returns top traits', () => {
      const summary = influence.getTraitSummary();
      expect(summary).toContain('protectiveness:80');
    });
  });
});
