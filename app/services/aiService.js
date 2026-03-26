const { OpenAI } = require("openai");
const config = require("../core/config");

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

async function getChatResponse(userMessage, history = []) {
  if (!config.OPENAI_API_KEY) {
    return "AI Assistant is currently offline (API key not configured).";
  }

  try {
    const messages = [
      { role: "system", content: "You are a helpful, friendly chat assistant named AI_Assistant. Keep your responses concise and engaging." },
      ...history.map(msg => ({
        role: msg.sender === "AI_Assistant" ? "assistant" : "user",
        content: msg.text
      })),
      { role: "user", content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 150,
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error("🚨 OpenAI API Error:", err);
    return "Sorry, I'm having trouble thinking right now. Please try again later.";
  }
}

async function summarizeChat(messages) {
    if (!config.OPENAI_API_KEY) return "Summary unavailable.";
    
    try {
        const textToSummarize = messages.map(m => `${m.sender}: ${m.text}`).join("\n");
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Summarize the following chat conversation into a few sentences." },
                { role: "user", content: textToSummarize }
            ],
            max_tokens: 100
        });
        return response.choices[0].message.content;
    } catch (err) {
        console.error("🚨 Summarization Error:", err);
        return "Failed to generate summary.";
    }
}

module.exports = { getChatResponse, summarizeChat };
