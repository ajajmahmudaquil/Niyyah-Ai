// ====================================================
// AI COACH CONFIGURATION
// To switch AI provider later, edit this file only.
// ====================================================

export type AIProvider = "openai" | "custom_http";

export const aiConfig = {
  enabled: process.env.AI_ENABLED === "true",
  provider: (process.env.AI_PROVIDER || "openai") as AIProvider,

  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: "gpt-4o-mini",
    maxTokens: 1000,
  },

  customHttp: {
    endpoint: process.env.CUSTOM_AI_ENDPOINT || "",
    apiKey: process.env.CUSTOM_AI_API_KEY || "",
  },
};
