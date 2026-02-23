import type { AIProvider, AIMessage } from "../provider";
import { aiConfig } from "../config";

export class CustomHTTPProvider implements AIProvider {
  isConfigured(): boolean {
    return !!aiConfig.customHttp.endpoint;
  }

  async chat(messages: AIMessage[]): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("Custom AI endpoint not configured");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (aiConfig.customHttp.apiKey) {
      headers["Authorization"] = `Bearer ${aiConfig.customHttp.apiKey}`;
    }

    const response = await fetch(aiConfig.customHttp.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Custom AI API error: ${err}`);
    }

    const data = await response.json();
    return data.response || data.choices?.[0]?.message?.content || data.message || "No response.";
  }
}
