import type { AIProvider, AIMessage } from "../provider";
import { aiConfig } from "../config";

export class OpenAIProvider implements AIProvider {
  isConfigured(): boolean {
    return !!aiConfig.openai.apiKey;
  }

  async chat(messages: AIMessage[]): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${aiConfig.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.openai.model,
        messages,
        max_tokens: aiConfig.openai.maxTokens,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response from AI.";
  }
}
