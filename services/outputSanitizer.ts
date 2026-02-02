// Output Sanitizer Service
// Cleans AI responses to ensure natural, non-clinical output

// === Prefix Patterns to Remove ===

const PREFIX_PATTERNS = [
  /^(Jonas?|Jono|Assistant|AI|Therapist|Counselor|Companion|User):\s*/i,
  /^\*\*(Jonas?|Jono|Assistant|Companion)\*\*:\s*/i,
  /^\[(Jonas?|Jono|Assistant|Companion)\]:\s*/i,
];

// === Internal Marker Patterns ===

const INTERNAL_MARKER_PATTERNS = [
  // XML tags (catch-all for any leaked tags)
  /<\/?[a-z]+>/gi,
  // Bracket markers
  /\[INTERNAL\][\s\S]*?\[\/INTERNAL\]/g,
  /\[THINKING\][\s\S]*?\[\/THINKING\]/g,
  /\[PLAN\][\s\S]*?\[\/PLAN\]/g,
  /\[(INTERNAL|THINKING|PLAN|CONTEXT|MEMORY|APPROACH)\]/gi,
  // Inline markers
  /\(internal:.*?\)/gi,
  /\(thinking:.*?\)/gi,
  // List formatting (numbered lists, bullets)
  /^\d+\.\s+/gm,
  /^[-•*]\s+/gm,
  /^#{1,6}\s+/gm,
];

// === Clinical Term Replacements ===

const CLINICAL_REPLACEMENTS: Array<[RegExp, string]> = [
  // Remove or soften therapeutic jargon
  [/it sounds like you(?:'re| are) experiencing/gi, 'it seems like'],
  [/I(?:'m| am) hearing that you/gi, 'sounds like you'],
  [/I want to validate your feelings/gi, 'I understand'],
  [/validate your (feelings|experience|emotions)/gi, 'understand how you feel'],
  [/cognitive distortion/gi, ''],
  [/all-or-nothing thinking/gi, 'black and white thinking'],
  [/catastrophizing/gi, 'assuming the worst'],
  [/emotional regulation/gi, 'handling emotions'],
  [/therapeutic (relationship|alliance)/gi, 'connection'],
  [/presenting (issue|problem|concern)/gi, 'situation'],
  [/maladaptive (behavior|pattern|thought)/gi, 'unhelpful habit'],
  [/processing your (emotions|feelings|trauma)/gi, 'working through this'],
  [/your (trauma|anxiety|depression) response/gi, 'this reaction'],
  [/from a clinical perspective/gi, ''],
  [/clinically speaking/gi, ''],
  [/in psychological terms/gi, ''],
  [/evidence-based/gi, ''],
  [/\bDSM\b/g, ''],
  [/psychodynamic/gi, ''],
  [/schema(?:s)?/gi, 'pattern'],
  [/attachment style/gi, 'way of connecting'],
  [/core belief(?:s)?/gi, 'deep belief'],
  [/automatic thought(?:s)?/gi, 'quick thought'],
  [/negative self-talk/gi, 'harsh inner voice'],
];

// === AI Pattern Removals ===

const AI_PATTERNS_TO_REMOVE: RegExp[] = [
  // Opening phrases
  /^(Certainly|Of course|Absolutely|Definitely|Sure thing)[!,.]?\s*/i,
  /^(Thank you for sharing|Thanks for sharing|I appreciate you sharing)[!,.]?\s*/i,
  /^(That's (a great|an excellent|a wonderful) question)[!,.]?\s*/i,
  /^(What a (great|wonderful|insightful) (point|observation|thought))[!,.]?\s*/i,
  /^(I'm (so )?glad you (shared|mentioned|brought up))[!,.]?\s*/i,

  // AI self-references
  /\bAs an AI\b[,.]?\s*/gi,
  /\bAs a (language model|virtual assistant|chatbot)\b[,.]?\s*/gi,
  /\bI('m| am) (just )?an AI\b[,.]?\s*/gi,
  /\bI don't have (personal )?(feelings|emotions|experiences)\b[,.]?\s*/gi,

  // Closing phrases
  /\s*(Is there anything else|Would you like to (talk|explore|discuss) more)[?.]?\s*$/i,
  /\s*I('m| am) here (for you|to (help|listen|support))[.!]?\s*$/i,
  /\s*Remember,? I('m| am) always here[.!]?\s*$/i,

  // Hedging language (excessive)
  /^(Just )?to be clear,?\s*/i,
  /^(Just )?to clarify,?\s*/i,
];

// === Softening Replacements ===

const SOFTENING_REPLACEMENTS: Array<[RegExp, string]> = [
  [/You should/gi, 'You might'],
  [/You need to/gi, 'It could help to'],
  [/You must/gi, 'Consider'],
  [/You have to/gi, 'You could try'],
  [/It's (important|essential|crucial) that you/gi, 'It might help to'],
];

// === Main Sanitization Function ===

export const sanitizeResponse = (response: string): string => {
  let sanitized = response;

  // 1. Remove name prefixes
  for (const pattern of PREFIX_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // 2. Remove internal markers
  for (const pattern of INTERNAL_MARKER_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // 3. Replace clinical terminology
  for (const [pattern, replacement] of CLINICAL_REPLACEMENTS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  // 4. Remove AI patterns
  for (const pattern of AI_PATTERNS_TO_REMOVE) {
    sanitized = sanitized.replace(pattern, '');
  }

  // 5. Soften directive language
  for (const [pattern, replacement] of SOFTENING_REPLACEMENTS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  // 6. Clean up whitespace
  sanitized = sanitized
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?])/g, '$1')
    .replace(/([.,!?])\s*([.,!?])/g, '$1')
    .trim();

  // 7. Remove empty parentheses or brackets left over
  sanitized = sanitized
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .trim();

  // 8. Ensure response doesn't start with lowercase after cleanup
  if (sanitized.length > 0 && /^[a-z]/.test(sanitized)) {
    sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
  }

  return sanitized;
};

// === Response Validation ===

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

export const validateResponse = (response: string): ValidationResult => {
  const issues: string[] = [];

  // Check for remaining prefixes
  for (const pattern of PREFIX_PATTERNS) {
    if (pattern.test(response)) {
      issues.push('Contains name prefix');
    }
  }

  // Check for internal markers
  for (const pattern of INTERNAL_MARKER_PATTERNS) {
    if (pattern.test(response)) {
      issues.push('Contains internal markers');
    }
  }

  // Check for clinical terms that should have been replaced
  const clinicalTerms = [
    'cognitive distortion',
    'maladaptive',
    'psychodynamic',
    'DSM',
    'therapeutic alliance',
  ];
  for (const term of clinicalTerms) {
    if (response.toLowerCase().includes(term.toLowerCase())) {
      issues.push(`Contains clinical term: ${term}`);
    }
  }

  // Check response length (too short or too long)
  if (response.length < 10) {
    issues.push('Response too short');
  }
  if (response.length > 500) {
    issues.push('Response too long (should be 1-3 sentences)');
  }

  // Check for multiple questions
  const questionCount = (response.match(/\?/g) || []).length;
  if (questionCount > 1) {
    issues.push('Contains multiple questions');
  }

  // Check for AI self-references
  if (/\bAs an AI\b/i.test(response) || /\bI('m| am) (just )?an AI\b/i.test(response)) {
    issues.push('Contains AI self-reference');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

// === Full Sanitization Pipeline ===

export const sanitizeAndValidate = (response: string): {
  sanitized: string;
  validation: ValidationResult;
} => {
  const sanitized = sanitizeResponse(response);
  const validation = validateResponse(sanitized);

  return {
    sanitized,
    validation,
  };
};

// === Ensure Quality Response ===

export const ensureQualityResponse = (response: string): string => {
  // If input is empty, return empty (let caller decide what to do)
  if (!response || response.trim().length === 0) {
    console.warn('ensureQualityResponse received empty input');
    return '';
  }

  const { sanitized, validation } = sanitizeAndValidate(response);

  // Log validation issues but don't fail - AI responses should be used
  if (!validation.isValid) {
    console.warn('Response had validation issues (cleaned):', validation.issues);
  }

  // Return sanitized response - even if it's short, it's better than nothing
  if (sanitized && sanitized.length > 0) {
    return sanitized;
  }

  // If sanitization removed everything, return original with basic cleanup
  console.warn('Sanitization removed all content, returning cleaned original');
  return response.replace(/<\/?[a-z]+>/gi, '').trim();
};
