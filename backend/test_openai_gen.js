const path = require('path');
const OpenAI = require(path.resolve(__dirname, 'node_modules/openai'));
require(path.resolve(__dirname, 'node_modules/dotenv')).config({ path: path.resolve(__dirname, '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testJSON() {
  const timestamp = Date.now();
  const randomTopic = 'Technology';
  try {
    console.log('Sending request to OpenAI...');
    const aiRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an expert Cambridge IELTS test creator. Return JSON: {"prompt": "essay question in English", "suggestedVocabulary": [{"word": "word", "meaning": "meaning", "collocation": "collocation"}]}'
        },
        {
          role: 'user',
          content: `Create a completely unique IELTS Writing Task 2 question about ${randomTopic} with ID ${timestamp}.`
        }
      ],
      temperature: 0.95
    });
    console.log('AI GENERATED PROMPT:', JSON.parse(aiRes.choices[0].message.content));
  } catch (err) {
    console.error('API ERROR:', err.message);
  }
}
testJSON();
