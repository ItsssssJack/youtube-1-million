import { GoogleGenAI } from "@google/genai";
import { CHANNEL_CONTEXT, MOCK_VIDEOS, MOCK_IDEAS } from "../constants";
import config from "../config";

const apiKey = config.gemini.apiKey;

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const sendMessageToGemini = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string
): Promise<string> => {
  if (!ai) {
    return "API Key is missing. Please set it in your environment.";
  }

  // Construct system context
  const systemInstruction = `
    You are the "Sparring Partner" for a YouTube Growth Intelligence Dashboard.
    Your goal is to help the creator (Jack) identify growth opportunities.

    Current Channel Context:
    ${CHANNEL_CONTEXT}

    Recent Outlier Videos Detected in the Market:
    ${MOCK_VIDEOS.map(v => `- "${v.title}" by ${v.channelName} (${v.views} views, Score: ${v.outlierScore})`).join('\n')}

    Current Idea Queue:
    ${MOCK_IDEAS.map(i => `- ${i.title} (Status: ${i.status}, Priority: ${i.priority})`).join('\n')}

    Your Role:
    1. Analyze the mock data provided.
    2. Suggest new video ideas based on outliers.
    3. Critique existing ideas.
    4. Answer questions about channel strategy.
    5. Be concise, strategic, and data-driven.
    
    Do not invent fake data outside of what is provided, but you can infer trends.
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error connecting to the intelligence engine.";
  }
};