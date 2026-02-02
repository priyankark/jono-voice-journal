import { JournalEntry, Article, PRESET_PROMPT_TEMPLATES, ContentType } from '../types';
import * as Crypto from 'expo-crypto';
import { apple } from '@react-native-ai/apple';
import { generateText } from 'ai';
import { extractKeyQuotes } from './transcription';

export interface ArticleGenerationOptions {
  style: 'formal' | 'casual' | 'journalistic';
  includeQuotes: boolean;
  maxLength?: number;
  customPrompt?: string;  // Custom user prompt for content generation
  presetId?: string;      // ID of the preset template being used
}

const DEFAULT_OPTIONS: ArticleGenerationOptions = {
  style: 'journalistic',
  includeQuotes: true,
  maxLength: 1500,
};

// ============================================================================
// TEMPERATURE CONFIGURATIONS
// ============================================================================
// Temperature guidelines:
// - 0.2-0.4: Factual, precise content (summaries, titles, proofreading)
// - 0.5-0.6: Balanced creativity (standard articles, life lessons)
// - 0.7-0.8: Creative content (poems, affirmations, letters)
// - 0.85+:   Highly creative/experimental (short stories)

const TEMPERATURE_CONFIG = {
  // Core generation tasks
  title: 0.35,           // Titles should be concise and accurate
  summary: 0.4,          // Summaries need factual precision
  standardArticle: 0.55, // Balanced creativity for articles
  customContent: 0.65,   // Slightly more creative for custom prompts

  // Improvement actions
  proofread: 0.15,       // Very low - preserve original meaning
  rewrite: 0.5,          // Balanced for clarity improvements
  shorten: 0.35,         // Lower - focus on preserving key info
  elaborate: 0.55,       // Moderate - add detail thoughtfully

  // Preset-specific temperatures (fallback if not defined in template)
  presets: {
    'poem': 0.8,           // High creativity for poetic expression
    'letter-future': 0.6,  // Warm but thoughtful
    'gratitude': 0.4,      // Grounded, sincere
    'lessons': 0.5,        // Balanced wisdom extraction
    'story': 0.85,         // High creativity for narrative
    'affirmations': 0.7,   // Uplifting but authentic
    'mantra': 0.65,        // Evocative but grounded
    'reflection': 0.55,    // Balanced introspection
  } as Record<string, number>,
};

// ============================================================================
// SYSTEM PROMPTS - Establishing AI Role & Context
// ============================================================================

const SYSTEM_PROMPTS = {
  // Master system prompt for all content generation
  base: `You are a skilled writing assistant transforming personal journal entries into meaningful content.

CRITICAL RULES:
- Write FROM the user's perspective, not as an AI
- Never refer to yourself, any AI persona, or "Jono/Jonas"
- Use first person ("I", "my") when the content calls for it - this is THE USER'S voice
- The output should read as if the user wrote it themselves

CORE PRINCIPLES:
- Honor the user's authentic voice and experiences
- Write with warmth, empathy, and emotional intelligence
- Create content that feels deeply personal, not AI-generated
- Preserve the essence of original thoughts while elevating expression
- Be insightful without being preachy or presumptuous

QUALITY STANDARDS:
- Every sentence should serve a purpose
- Use vivid, specific language over vague generalities
- Balance introspection with forward-looking perspective
- Maintain a tone that feels like a trusted friend, not a therapist
- Respect the vulnerability inherent in personal journaling`,

  // For title generation
  titleGeneration: `You are crafting a title for deeply personal content. Create titles that:
- Capture the emotional essence in 3-8 words
- Feel intriguing yet authentic, not clickbait
- Use evocative language that resonates
- Avoid cliches and generic phrases`,

  // For summary generation
  summaryGeneration: `You are creating a brief summary of personal reflections. Your summary should:
- Distill the core themes in 2-3 sentences
- Honor the emotional journey present in the content
- Provide a meaningful preview without spoiling insights
- Use warm, inviting language`,

  // For standard article generation
  articleGeneration: `You are a thoughtful editor helping someone turn their raw journal entries into a cohesive narrative piece. Your role is to:
- Weave scattered thoughts into a flowing narrative
- Preserve authentic voice while improving clarity
- Surface patterns and insights the writer may not have noticed
- Create something the writer will be proud to revisit`,

  // For preset-specific content
  presets: {
    poem: `Create a poem that finds beauty in everyday experiences and emotions. The poetry should:
- Use imagery drawn directly from the source material
- Balance accessibility with depth
- Employ natural rhythm without forced rhyme schemes
- Capture complex emotions in crystallized moments
- Feel genuine, never pretentious or overly abstract
- Be written in the user's voice using first person where appropriate`,

    'letter-future': `Create a letter to the user's future self. This letter should:
- Speak directly and warmly to the future reader using "I" and "my"
- Capture the present moment's texture and feelings
- Include hopes, lessons, and reminders worth preserving
- Balance reflection on challenges with gratitude for growth
- Feel like a time capsule of the current emotional landscape
- Be written entirely from the user's perspective`,

    gratitude: `Create a gratitude reflection that:
- Goes beyond surface-level thankfulness to meaningful appreciation
- Finds gratitude even in challenging circumstances when authentic
- Uses specific, sensory language to make gratitude tangible
- Helps the writer feel genuinely uplifted, not guilted into positivity
- Connects gratitude to personal values and growth
- Uses first person ("I am grateful for...") throughout`,

    lessons: `Distill life lessons from the user's experiences. The insights should:
- Extract actionable wisdom, not just observations
- Connect specific experiences to universal truths
- Present lessons with humility, not preachiness
- Honor both successes and struggles as teachers
- Offer perspective that feels earned, not prescribed
- Be written as if the user is sharing their own hard-won wisdom`,

    story: `Transform personal experiences into narrative fiction. The story should:
- Use the emotional truth of experiences as foundation
- Create compelling characters and scenarios
- Build tension, discovery, and resolution
- Balance familiar elements with surprising perspectives
- Leave readers with something to ponder
- Never reference the writing process or any AI involvement`,

    affirmations: `Create personal affirmations rooted in authentic experiences. The affirmations should:
- Draw directly from the user's actual strengths and growth
- Feel believable and achievable, not impossibly aspirational
- Use "I" statements that feel natural to say aloud
- Address specific challenges mentioned in the source material
- Build confidence without toxic positivity
- Sound like the user speaking to themselves`,
  } as Record<string, string>,
};

// ============================================================================
// USER PROMPT TEMPLATES - Structured Instructions for Each Task
// ============================================================================

const buildTitlePrompt = (rawContent: string, interviewees: string[], isCustomPrompt: boolean, customPrompt?: string): string => {
  if (isCustomPrompt) {
    return `Create a compelling, evocative title for content generated with this creative direction: "${customPrompt}"

The title should:
1. Be 3-8 words maximum
2. Capture the emotional core or central theme
3. Feel personal and meaningful, not generic
4. Intrigue without being clickbait

SOURCE MATERIAL (first 1000 chars):
${rawContent.slice(0, 1000)}

Respond with ONLY the title, no quotes, no explanation.`;
  }

  return `Create a compelling title for these personal reflections and journal notes.

CONTEXT:
${interviewees.length > 0 ? `- Subject/Context: ${interviewees.join(', ')}` : '- Personal reflection'}
- This is private journaling content being transformed into a readable piece

TITLE REQUIREMENTS:
1. 3-8 words maximum
2. Capture the dominant emotion or insight
3. Feel authentic and personal
4. Avoid generic phrases like "My Journey" or "Life Lessons"

SOURCE MATERIAL:
${rawContent.slice(0, 1000)}

Respond with ONLY the title, no quotes, no explanation.`;
};

const buildSummaryPrompt = (rawContent: string, isCustomPrompt: boolean, customPrompt?: string): string => {
  if (isCustomPrompt) {
    return `Write a 2-3 sentence summary that captures the essence of content created with this direction: "${customPrompt}"

The summary should:
1. Preview the emotional journey or key themes
2. Feel inviting and warm
3. Give a sense of what makes this piece meaningful
4. Be specific to THIS content, not generic

SOURCE MATERIAL:
${rawContent.slice(0, 2000)}

Respond with ONLY the summary paragraph.`;
  }

  return `Create a 2-3 sentence executive summary of these personal journal notes.

SUMMARY GUIDELINES:
1. Identify the 1-2 core themes or emotions
2. Hint at insights without spoiling them
3. Make the reader want to explore further
4. Use warm, accessible language

SOURCE NOTES:
${rawContent.slice(0, 2000)}

Respond with ONLY the summary paragraph.`;
};

const buildContentPrompt = (
  rawContent: string,
  opts: ArticleGenerationOptions,
  presetId?: string
): string => {
  // Handle preset-specific prompts
  if (presetId && opts.customPrompt) {
    return buildPresetContentPrompt(rawContent, presetId, opts.customPrompt, opts.maxLength || 1500);
  }

  // Handle custom prompts (non-preset)
  if (opts.customPrompt) {
    return `${opts.customPrompt}

IMPORTANT GUIDELINES:
- Draw directly from the source material below
- Preserve the authentic voice and emotions present
- Be creative in interpretation while honoring the original intent
- Use markdown formatting where appropriate (headings with ##, emphasis, etc.)

SOURCE MATERIAL (Personal journal entries and thoughts):
---
${rawContent}
---

Create something meaningful that the writer will treasure.`;
  }

  // Standard article generation
  const styleGuides = {
    formal: `STYLE: Professional and polished
- Use clear, precise language
- Maintain an authoritative yet warm tone
- Structure ideas logically with smooth transitions
- Suitable for sharing in professional contexts`,

    casual: `STYLE: Conversational and approachable
- Write as if talking to a trusted friend
- Allow personality to shine through
- Use natural language and contractions
- Feel relaxed yet thoughtful`,

    journalistic: `STYLE: Engaging narrative journalism
- Open with a compelling hook
- Weave a story arc through the piece
- Balance scene-setting with insight
- Create a sense of momentum and discovery`,
  };

  return `Transform these personal journal entries into a cohesive, well-crafted article.

${styleGuides[opts.style]}

STRUCTURE REQUIREMENTS:
- Use markdown headings (##) to organize sections
- Aim for approximately ${opts.maxLength} words
- Create a satisfying narrative arc: opening hook, development, meaningful conclusion
${opts.includeQuotes ? '- Weave in direct quotes where they add impact and authenticity' : '- Paraphrase rather than using direct quotes'}

QUALITY CHECKLIST:
- Every paragraph should advance the narrative or deepen insight
- Vary sentence length and structure for rhythm
- End with something memorable - an insight, question, or forward-looking thought
- Make transitions feel natural, not mechanical

SOURCE MATERIAL:
---
${rawContent}
---

Create an article the writer will be proud of.`;
};

const buildPresetContentPrompt = (
  rawContent: string,
  presetId: string,
  basePrompt: string,
  maxLength: number
): string => {
  const presetInstructions: Record<string, string> = {
    poem: `${basePrompt}

POETIC GUIDELINES:
- Let form follow feeling - free verse is perfectly acceptable
- Use sensory details from the source material as imagery
- Create moments of recognition and emotional resonance
- Aim for 12-24 lines unless the content calls for more
- End with an image or line that lingers

TECHNIQUES TO CONSIDER:
- Repetition for emphasis
- Line breaks for pacing and emphasis
- Concrete images over abstract statements
- The specific detail that opens to universal feeling

SOURCE MATERIAL (Your emotional landscape to draw from):
---
${rawContent}
---

Write a poem that captures something true.`,

    'letter-future': `${basePrompt}

LETTER GUIDELINES:
- Address your future self directly ("Dear Future Me" or similar)
- Ground the letter in specific current details (what you're feeling, facing, hoping)
- Include at least one piece of advice or reminder you want to remember
- Acknowledge both struggles and growth
- Close with warmth and encouragement
- Aim for 300-500 words

STRUCTURE SUGGESTION:
1. Opening: Where you are right now (emotionally, situationally)
2. Middle: What you're learning, what matters to you now
3. Close: What you hope for, what you want to remember

SOURCE MATERIAL (Current thoughts and feelings):
---
${rawContent}
---

Write a letter that your future self will treasure finding.`,

    gratitude: `${basePrompt}

GRATITUDE LIST GUIDELINES:
- Go beyond surface thankfulness to meaningful appreciation
- For each item, include WHY it matters to you
- Find gratitude in unexpected places when authentic
- Aim for 5-10 items with brief reflections on each
- Use specific, sensory language

FORMAT EXAMPLE:
## [Category or Theme]
**[Thing you're grateful for]**: [1-2 sentences on why this matters and how it enriches your life]

SOURCES OF GRATITUDE TO EXPLORE:
- People and relationships
- Experiences and moments
- Personal growth and lessons learned
- Simple pleasures and daily joys
- Challenges that led to growth

SOURCE MATERIAL:
---
${rawContent}
---

Create a gratitude list that helps you truly feel the abundance in your life.`,

    lessons: `${basePrompt}

LIFE LESSONS GUIDELINES:
- Extract 3-5 core lessons from the source material
- Make each lesson actionable and specific
- Support each lesson with context from your experiences
- Balance wisdom with humility
- Include how you might apply these lessons going forward

FORMAT FOR EACH LESSON:
## Lesson [N]: [Concise lesson title]
**The Insight**: [2-3 sentences explaining the lesson]
**From Experience**: [How this emerged from your actual experiences]
**Going Forward**: [How you might apply this]

GOOD LESSONS ARE:
- Specific enough to be actionable
- Universal enough to be meaningful
- Honest about complexity and nuance
- Forward-looking, not just reflective

SOURCE MATERIAL:
---
${rawContent}
---

Distill wisdom that will serve you well.`,

    story: `${basePrompt}

SHORT STORY GUIDELINES:
- Use the emotional truth of your experiences as the foundation
- Transform real elements into fiction (change names, settings, details)
- Create a clear narrative arc: setup, rising action, climax, resolution
- Develop at least one character the reader will care about
- Aim for 500-800 words
- End with resonance - a moment of change, understanding, or beauty

STORYTELLING TECHNIQUES:
- Open in the middle of action or tension
- Use dialogue to reveal character
- Show emotions through action and detail, not just statements
- Create a moment of turn or revelation
- Trust the reader to understand without over-explaining

SOURCE MATERIAL (Emotional raw material, not a literal outline):
---
${rawContent}
---

Write a story that captures something true through the lens of fiction.`,

    affirmations: `${basePrompt}

AFFIRMATION GUIDELINES:
- Create 8-12 personalized affirmations
- Root each in evidence from the source material
- Use present tense "I am" / "I have" / "I create" statements
- Balance self-acceptance with growth orientation
- Make them feel true and achievable, not impossibly aspirational
- Group by theme if natural categories emerge

FORMAT:
## [Theme]
- **I [affirmation]** - [brief grounding in your actual experience/strength]

GOOD AFFIRMATIONS ARE:
- Specific to YOUR life and growth
- Stated positively (what you ARE, not what you're NOT)
- Believable when you say them aloud
- Connected to values that matter to you
- Building on real evidence of your capabilities

SOURCE MATERIAL (Evidence of your strengths and growth):
---
${rawContent}
---

Create affirmations you'll actually believe and use.`,
  };

  return presetInstructions[presetId] || `${basePrompt}

SOURCE MATERIAL:
---
${rawContent}
---

Create something meaningful from these personal reflections.`;
};

// Helper to get temperature for a given context
const getTemperature = (context: 'title' | 'summary' | 'content', opts?: ArticleGenerationOptions): number => {
  if (context === 'title') return TEMPERATURE_CONFIG.title;
  if (context === 'summary') return TEMPERATURE_CONFIG.summary;

  // Content temperature depends on preset or custom prompt
  if (opts?.presetId) {
    // First check if preset template has explicit temperature
    const template = PRESET_PROMPT_TEMPLATES.find(t => t.id === opts.presetId);
    if (template?.temperature) {
      return template.temperature;
    }
    // Fall back to config presets
    if (TEMPERATURE_CONFIG.presets[opts.presetId]) {
      return TEMPERATURE_CONFIG.presets[opts.presetId];
    }
  }
  if (opts?.customPrompt) {
    return TEMPERATURE_CONFIG.customContent;
  }
  return TEMPERATURE_CONFIG.standardArticle;
};

// Combine entry content into readable text
const combineEntryContent = (entry: JournalEntry): string => {
  let content = '';

  if (entry.interviewee) {
    content += `Interview with ${entry.interviewee}\n\n`;
  }

  if (entry.textNotes) {
    content += entry.textNotes + '\n\n';
  }

  if (entry.voiceRecording?.transcription) {
    content += entry.voiceRecording.transcription + '\n\n';
  }

  if (entry.keyMoments.length > 0) {
    content += 'Key Moments:\n';
    entry.keyMoments.forEach(km => {
      content += `- ${km.note}\n`;
    });
  }

  return content;
};

// Generate article from entries using Apple Intelligence
export const generateArticle = async (
  entries: JournalEntry[],
  options: Partial<ArticleGenerationOptions> = {}
): Promise<Article> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Combine all entry content
  const rawContent = entries.map(combineEntryContent).join('\n---\n');

  // Extract interviewees
  const interviewees = entries
    .filter(e => e.interviewee)
    .map(e => e.interviewee!)
    .filter((v, i, a) => a.indexOf(v) === i);

  // Extract key quotes using AI (safely)
  let keyQuotes: string[] = [];
  try {
    keyQuotes = await extractKeyQuotes(rawContent);
  } catch (e) {
    console.warn('Key quote extraction failed, continuing without quotes:', e);
    keyQuotes = [];
  }

  // Check if Apple Intelligence is available
  if (!apple.isAvailable()) {
    console.log('[ArticleGen] Apple Intelligence not available, using fallback');
    return generateArticleFallback(entries, rawContent, interviewees, keyQuotes, opts);
  }

  try {
    // Check if using custom prompt
    const isCustomPrompt = !!opts.customPrompt;
    const presetId = opts.presetId;

    // Determine the appropriate system prompt for content generation
    const getContentSystemPrompt = (): string => {
      if (presetId && SYSTEM_PROMPTS.presets[presetId]) {
        return `${SYSTEM_PROMPTS.base}\n\n${SYSTEM_PROMPTS.presets[presetId]}`;
      }
      if (isCustomPrompt) {
        return SYSTEM_PROMPTS.base;
      }
      return `${SYSTEM_PROMPTS.base}\n\n${SYSTEM_PROMPTS.articleGeneration}`;
    };

    // Generate title using AI
    console.log('[ArticleGen] Starting title generation...');
    const titlePrompt = buildTitlePrompt(rawContent, interviewees, isCustomPrompt, opts.customPrompt);

    const { text: title } = await generateText({
      model: apple() as any,
      system: `${SYSTEM_PROMPTS.base}\n\n${SYSTEM_PROMPTS.titleGeneration}`,
      prompt: titlePrompt,
      temperature: getTemperature('title'),
    });
    console.log('[ArticleGen] Title generated:', title.slice(0, 50));

    // Generate summary using AI
    console.log('[ArticleGen] Starting summary generation...');
    const summaryPrompt = buildSummaryPrompt(rawContent, isCustomPrompt, opts.customPrompt);

    const { text: summary } = await generateText({
      model: apple() as any,
      system: `${SYSTEM_PROMPTS.base}\n\n${SYSTEM_PROMPTS.summaryGeneration}`,
      prompt: summaryPrompt,
      temperature: getTemperature('summary'),
    });

    // Generate full content using AI
    console.log('[ArticleGen] Starting full content generation...');
    const contentPrompt = buildContentPrompt(rawContent, opts, presetId);
    const contentTemperature = getTemperature('content', opts);

    console.log(`[ArticleGen] Using temperature ${contentTemperature} for ${presetId || (isCustomPrompt ? 'custom' : 'standard')} content`);

    const { text: content } = await generateText({
      model: apple() as any,
      system: getContentSystemPrompt(),
      prompt: contentPrompt,
      temperature: contentTemperature,
      maxTokens: opts.maxLength ? opts.maxLength * 2 : 4000,
    } as any);

    // Determine content type
    const getContentType = (): ContentType => {
      if (presetId) {
        // Map preset ID to content type
        const presetToType: Record<string, ContentType> = {
          'poem': 'poem',
          'letter-future': 'letter',
          'gratitude': 'gratitude',
          'lessons': 'lessons',
          'story': 'story',
          'affirmations': 'affirmations',
          'mantra': 'mantra',
          'reflection': 'reflection',
        };
        return presetToType[presetId] || 'custom';
      }
      if (isCustomPrompt) return 'custom';
      return 'article';
    };

    const article: Article = {
      id: Crypto.randomUUID(),
      entryIds: entries.map(e => e.id),
      title: title.trim(),
      content,
      keyQuotes,
      summary: summary.trim(),
      status: 'draft',
      createdAt: new Date(),
      generationPrompt: opts.customPrompt,
      generationType: isCustomPrompt ? 'custom' : 'standard',
      contentType: getContentType(),
    };

    return article;
  } catch (error) {
    console.error('Article generation error:', error);
    return generateArticleFallback(entries, rawContent, interviewees, keyQuotes, opts);
  }
};

// Fallback article generation without AI
const generateArticleFallback = (
  entries: JournalEntry[],
  rawContent: string,
  interviewees: string[],
  keyQuotes: string[],
  opts: ArticleGenerationOptions
): Article => {
  const isCustomPrompt = !!opts.customPrompt;

  const title = isCustomPrompt
    ? `Custom Content - ${new Date().toLocaleDateString()}`
    : interviewees.length > 0
      ? `Insights from ${interviewees.join(', ')}`
      : `Interview Notes - ${new Date().toLocaleDateString()}`;

  const summary = isCustomPrompt
    ? `This content was generated from ${entries.length} entries using a custom prompt. AI generation was not available, showing raw content.`
    : `This article synthesizes insights from ${entries.length} interview${entries.length > 1 ? 's' : ''} ` +
      `${interviewees.length > 0 ? `with ${interviewees.join(', ')}` : ''}. ` +
      `Key themes and quotes have been extracted for easy reference.`;

  const content = formatAsArticle(rawContent);

  // Determine content type for fallback
  const getContentTypeFallback = (): ContentType => {
    if (opts.presetId) {
      const presetToType: Record<string, ContentType> = {
        'poem': 'poem',
        'letter-future': 'letter',
        'gratitude': 'gratitude',
        'lessons': 'lessons',
        'story': 'story',
        'affirmations': 'affirmations',
        'mantra': 'mantra',
        'reflection': 'reflection',
      };
      return presetToType[opts.presetId] || 'custom';
    }
    if (isCustomPrompt) return 'custom';
    return 'article';
  };

  return {
    id: Crypto.randomUUID(),
    entryIds: entries.map(e => e.id),
    title,
    content,
    keyQuotes,
    summary,
    status: 'draft',
    createdAt: new Date(),
    generationPrompt: opts.customPrompt,
    generationType: isCustomPrompt ? 'custom' : 'standard',
    contentType: getContentTypeFallback(),
  };
};

// Format raw notes as article (basic formatting)
const formatAsArticle = (raw: string): string => {
  const paragraphs = raw.split('\n\n').filter(p => p.trim());
  let formatted = '';

  paragraphs.forEach((p, i) => {
    if (i === 0) {
      formatted += `## Overview\n\n${p}\n\n`;
    } else if (p.startsWith('Key Moments:')) {
      formatted += `## ${p}\n\n`;
    } else if (p.startsWith('-')) {
      formatted += p + '\n\n';
    } else {
      formatted += p + '\n\n';
    }
  });

  return formatted;
};

// Improve article with Apple Intelligence Writing Tools
export const improveArticle = async (
  article: Article,
  action: 'proofread' | 'rewrite' | 'shorten' | 'elaborate' = 'proofread'
): Promise<Article> => {
  if (!apple.isAvailable()) {
    return { ...article, status: 'polished' };
  }

  // System prompt for editing/improvement tasks
  const editingSystemPrompt = `You are a skilled editor helping polish personal writing. Your role is to:
- Preserve the authentic voice and personal nature of the content
- Enhance clarity and readability without making it feel generic
- Respect the emotional weight and meaning in the original
- Make improvements that feel like refinements, not rewrites (unless asked)`;

  const actionPrompts = {
    proofread: `Carefully proofread this personal article and fix any errors while preserving the author's unique voice.

PROOFREAD FOR:
- Grammar and syntax errors
- Spelling mistakes
- Punctuation issues
- Awkward phrasing that might distract readers

IMPORTANT:
- Do NOT change the author's style or voice
- Do NOT add new content or ideas
- Do NOT remove emotional or personal elements
- Keep all corrections subtle and invisible

ARTICLE TO PROOFREAD:
---
${article.content}
---

Return the proofread article with corrections applied.`,

    rewrite: `Rewrite this personal article for improved clarity and flow while keeping its heart intact.

REWRITE GUIDELINES:
- Improve sentence structure and transitions
- Enhance readability and rhythm
- Clarify any confusing passages
- Strengthen the opening and closing

PRESERVE:
- The author's authentic voice and personality
- All key insights and emotional moments
- The overall structure and arc
- Direct quotes and specific details

ARTICLE TO REWRITE:
---
${article.content}
---

Return the improved article.`,

    shorten: `Condense this personal article while preserving its emotional impact and key insights.

CONDENSING GUIDELINES:
- Reduce length by approximately 30-40%
- Keep the most powerful moments and insights
- Preserve the narrative arc in compressed form
- Maintain the opening hook and strong ending

PRIORITIZE KEEPING:
- Unique insights and realizations
- Emotionally resonant passages
- Specific, vivid details (over general statements)
- The authentic voice of the author

ARTICLE TO CONDENSE:
---
${article.content}
---

Return the condensed article.`,

    elaborate: `Expand this personal article with richer detail and deeper exploration.

ELABORATION GUIDELINES:
- Add depth to existing ideas (don't introduce unrelated topics)
- Expand on moments that feel rushed
- Add sensory details and context where appropriate
- Deepen the reflection and insight

MAINTAIN:
- The original structure and flow
- The author's voice and style
- The current emotional tone
- Authenticity - don't add experiences that weren't implied

ARTICLE TO ELABORATE:
---
${article.content}
---

Return the expanded article.`,
  };

  // Get the appropriate temperature for each action
  const actionTemperatures: Record<string, number> = {
    proofread: TEMPERATURE_CONFIG.proofread,
    rewrite: TEMPERATURE_CONFIG.rewrite,
    shorten: TEMPERATURE_CONFIG.shorten,
    elaborate: TEMPERATURE_CONFIG.elaborate,
  };

  try {
    const { text: improvedContent } = await generateText({
      model: apple() as any,
      system: editingSystemPrompt,
      prompt: actionPrompts[action],
      temperature: actionTemperatures[action],
      maxTokens: 4000,
    } as any);

    return {
      ...article,
      content: improvedContent,
      status: 'polished',
    };
  } catch (error) {
    console.error('Article improvement error:', error);
    return { ...article, status: 'polished' };
  }
};

// Stream article generation for real-time display
export const streamArticleGeneration = async (
  entries: JournalEntry[],
  onChunk: (text: string) => void,
  options: Partial<ArticleGenerationOptions> = {}
): Promise<void> => {
  if (!apple.isAvailable()) {
    throw new Error('Apple Intelligence is not available on this device.');
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const rawContent = entries.map(combineEntryContent).join('\n---\n');
  const isCustomPrompt = !!opts.customPrompt;
  const presetId = opts.presetId;

  // Build the appropriate prompt
  const contentPrompt = buildContentPrompt(rawContent, opts, presetId);
  const contentTemperature = getTemperature('content', opts);

  // Determine system prompt
  let systemPrompt = SYSTEM_PROMPTS.base;
  if (presetId && SYSTEM_PROMPTS.presets[presetId]) {
    systemPrompt = `${SYSTEM_PROMPTS.base}\n\n${SYSTEM_PROMPTS.presets[presetId]}`;
  } else if (!isCustomPrompt) {
    systemPrompt = `${SYSTEM_PROMPTS.base}\n\n${SYSTEM_PROMPTS.articleGeneration}`;
  }

  console.log(`[ArticleGen] Streaming with temperature ${contentTemperature}`);

  const { streamText } = await import('ai');
  const result = streamText({
    model: apple(),
    system: systemPrompt,
    prompt: contentPrompt,
    temperature: contentTemperature,
  });

  for await (const chunk of (await result).textStream) {
    onChunk(chunk);
  }
};
