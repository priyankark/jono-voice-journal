// Intervention Library Service
// Pattern extraction, recommendation, and learning engine

import {
  Intervention,
  InterventionPattern,
  InterventionLibrary,
  PersonalizedStrategy,
  EmotionalIndicators,
  Conversation,
  ConversationMessage,
  TherapeuticApproach,
  CoachingApproach,
} from '../types';

// === Pattern Extraction ===

export const extractPatterns = (interventions: Intervention[]): InterventionPattern[] => {
  const patterns: InterventionPattern[] = [];

  // Group interventions by approach + category + emotional state
  const groups = new Map<string, Intervention[]>();

  for (const intervention of interventions) {
    // Skip interventions without feedback
    if (!intervention.feedback) continue;

    const key = `${intervention.approach}:${intervention.category}:${intervention.emotionalState.valence}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(intervention);
  }

  // Extract patterns from groups with at least 3 uses
  for (const [key, groupInterventions] of groups.entries()) {
    if (groupInterventions.length < 3) continue; // Minimum 3 uses to establish pattern

    const [approach, category] = key.split(':');

    // Calculate success metrics
    const successCount = groupInterventions.filter(i => {
      if (!i.feedback) return false;
      const { userEngagement, insightReported, actionTaken } = i.feedback;
      return userEngagement === 'high' || insightReported || actionTaken;
    }).length;

    // Calculate average effectiveness
    const effectiveInterventions = groupInterventions.filter(i => i.effectiveness !== undefined);
    const averageEffectiveness = effectiveInterventions.length > 0
      ? effectiveInterventions.reduce((sum, i) => sum + (i.effectiveness || 0), 0) / effectiveInterventions.length
      : 0;

    // Extract common situation tags
    const allTags = groupInterventions.flatMap(i => i.situationTags);
    const tagCounts = new Map<string, number>();
    for (const tag of allTags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
    const commonTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Extract "works best when" conditions
    const successfulInterventions = groupInterventions.filter(i => {
      if (!i.feedback) return false;
      const { userEngagement, insightReported, actionTaken } = i.feedback;
      return userEngagement === 'high' || insightReported || actionTaken;
    });

    const worksBestWhen = extractConditions(successfulInterventions, 'success');
    const avoidsWhen = extractConditions(
      groupInterventions.filter(i => !successfulInterventions.includes(i)),
      'avoid'
    );

    // Get last used timestamp
    const lastUsed = new Date(Math.max(...groupInterventions.map(i => i.timestamp.getTime())));

    patterns.push({
      id: `pattern-${approach}-${category}-${Date.now()}`,
      category: category as any,
      approach: approach as TherapeuticApproach | CoachingApproach,
      situationProfile: {
        commonTags,
        emotionalStates: groupInterventions.map(i => ({
          valence: i.emotionalState.valence,
          intensity: i.emotionalState.intensity,
          cognitiveDistortions: [],
          readyForChallenge: false,
          isEarlyConversation: false,
        })),
      },
      useCount: groupInterventions.length,
      successCount,
      averageEffectiveness,
      lastUsed,
      worksBestWhen,
      avoidsWhen,
    });
  }

  return patterns.sort((a, b) => b.averageEffectiveness - a.averageEffectiveness);
};

// === Condition Extraction ===

const extractConditions = (
  interventions: Intervention[],
  type: 'success' | 'avoid'
): string[] => {
  const conditions: string[] = [];

  // Analyze emotional patterns
  const intensities = interventions.map(i => i.emotionalState.intensity);
  const valences = interventions.map(i => i.emotionalState.valence);

  const highIntensity = intensities.filter(i => i === 'high').length / intensities.length;
  const negativeValence = valences.filter(v => v === 'negative').length / valences.length;

  if (highIntensity > 0.6) {
    conditions.push(type === 'success' ? 'high emotional intensity' : 'high emotional intensity');
  }
  if (negativeValence > 0.6) {
    conditions.push(type === 'success' ? 'negative emotions present' : 'negative emotions present');
  }

  // Analyze situation tags
  const allTags = interventions.flatMap(i => i.situationTags);
  const uniqueTags = [...new Set(allTags)];
  if (uniqueTags.length > 0) {
    const mostCommon = uniqueTags
      .map(tag => ({ tag, count: allTags.filter(t => t === tag).length }))
      .sort((a, b) => b.count - a.count)[0];

    if (mostCommon.count > interventions.length * 0.5) {
      conditions.push(`discussing ${mostCommon.tag}`);
    }
  }

  return conditions.slice(0, 3);
};

// === Intervention Recommendation ===

interface RecommendationContext {
  emotionalState: EmotionalIndicators;
  userMessage: string;
  conversationHistory: Conversation;
}

export const recommendIntervention = (
  context: RecommendationContext,
  library: InterventionLibrary
): PersonalizedStrategy | undefined => {
  const { emotionalState, userMessage, conversationHistory } = context;

  if (library.patterns.length === 0) {
    return undefined; // No patterns yet
  }

  // Score each pattern
  const scoredPatterns = library.patterns.map(pattern => {
    let score = 0;

    // Effectiveness weight (40%)
    score += pattern.averageEffectiveness * 0.4;

    // Context match weight (30%)
    const contextMatch = calculateContextMatch(pattern, emotionalState, conversationHistory);
    score += contextMatch * 0.3;

    // Recency weight (15%)
    const daysSinceUse = (Date.now() - pattern.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSinceUse / 30); // Decay over 30 days
    score += recencyScore * 0.15;

    // Diversity weight (15%) - prefer approaches not used recently
    const recentApproaches = conversationHistory.messages
      .slice(-6)
      .filter(m => m.role === 'assistant')
      .map(m => m.content);

    const approachUsedRecently = recentApproaches.some(content =>
      content.toLowerCase().includes(pattern.approach.toLowerCase())
    );
    const diversityScore = approachUsedRecently ? 0.5 : 1.0;
    score += diversityScore * 0.15;

    return { pattern, score };
  });

  // Get top recommendation
  const topRecommendation = scoredPatterns.sort((a, b) => b.score - a.score)[0];

  if (topRecommendation.score < 0.3) {
    return undefined; // Confidence too low
  }

  return {
    approach: topRecommendation.pattern.approach,
    category: topRecommendation.pattern.category,
    confidence: topRecommendation.score,
    reasoning: generateReasoning(topRecommendation.pattern, topRecommendation.score),
  };
};

// === Context Matching ===

const calculateContextMatch = (
  pattern: InterventionPattern,
  emotionalState: EmotionalIndicators,
  conversation: Conversation
): number => {
  let matchScore = 0;
  let factors = 0;

  // Match emotional valence
  const valenceMatches = pattern.situationProfile.emotionalStates.some(
    state => state.valence === emotionalState.valence
  );
  if (valenceMatches) {
    matchScore += 1;
  }
  factors++;

  // Match intensity
  const intensityMatches = pattern.situationProfile.emotionalStates.some(
    state => state.intensity === emotionalState.intensity
  );
  if (intensityMatches) {
    matchScore += 1;
  }
  factors++;

  // Match situation tags
  const conversationTags = conversation.discussedThemes || [];
  const tagOverlap = pattern.situationProfile.commonTags.filter(
    tag => conversationTags.includes(tag)
  ).length;
  if (tagOverlap > 0) {
    matchScore += Math.min(tagOverlap / pattern.situationProfile.commonTags.length, 1);
  }
  factors++;

  return matchScore / factors;
};

// === Reasoning Generation ===

const generateReasoning = (pattern: InterventionPattern, score: number): string => {
  const successRate = Math.round((pattern.successCount / pattern.useCount) * 100);
  const reasons: string[] = [];

  reasons.push(`${successRate}% success rate with this approach (${pattern.successCount}/${pattern.useCount})`);

  if (pattern.worksBestWhen.length > 0) {
    reasons.push(`Works best when: ${pattern.worksBestWhen.join(', ')}`);
  }

  if (pattern.situationProfile.commonTags.length > 0) {
    reasons.push(`Effective for: ${pattern.situationProfile.commonTags.slice(0, 2).join(', ')}`);
  }

  return reasons.join('. ');
};

// === Pattern Learning / Update ===

export const shouldUpdatePatterns = (library: InterventionLibrary): boolean => {
  // Check if we have at least 10 interventions without feedback
  const interventionsWithoutFeedback = library.interventions.filter(
    i => !i.feedback
  ).length;

  return interventionsWithoutFeedback >= 10;
};

export const updatePatterns = (library: InterventionLibrary): InterventionLibrary => {
  const newPatterns = extractPatterns(library.interventions);

  return {
    ...library,
    patterns: newPatterns,
  };
};

// === Effectiveness Calculation ===

export const calculateEffectiveness = (
  feedback: Intervention['feedback']
): number => {
  if (!feedback) return 0;

  let score = 0;
  let maxScore = 0;

  // User engagement (30%)
  if (feedback.userEngagement === 'high') score += 0.3;
  else if (feedback.userEngagement === 'medium') score += 0.15;
  maxScore += 0.3;

  // Emotional shift (25%)
  if (feedback.emotionalShift === 'positive') score += 0.25;
  else if (feedback.emotionalShift === 'neutral') score += 0.1;
  maxScore += 0.25;

  // Insight reported (25%)
  if (feedback.insightReported) score += 0.25;
  maxScore += 0.25;

  // Action taken (20%)
  if (feedback.actionTaken) score += 0.2;
  maxScore += 0.2;

  return score / maxScore;
};
