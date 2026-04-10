const Anthropic = require('@anthropic-ai/sdk');

const styleAdvisorPrompt = require('../prompts/style-advisor');
const outfitGeneratorPrompt = require('../prompts/outfit-generator');
const wardrobeAssistantPrompt = require('../prompts/wardrobe-assistant');

const client = new Anthropic();

const SYSTEM_PROMPTS = {
  'style-advisor': styleAdvisorPrompt,
  'outfit-generator': outfitGeneratorPrompt,
  'wardrobe-assistant': wardrobeAssistantPrompt,
};

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20241022';

async function chat(mode, messages) {
  const systemPrompt = SYSTEM_PROMPTS[mode];
  if (!systemPrompt) {
    throw new Error(`Unknown mode: ${mode}`);
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : '';
}

module.exports = { chat };
