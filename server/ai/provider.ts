export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProvider {
  chat(messages: AIMessage[]): Promise<string>;
  isConfigured(): boolean;
}
