import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Send, Sparkles } from "lucide-react";

export default function CoachPage() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const res = await apiRequest("POST", "/api/ai/chat", { message: userMessage });
      return res.json();
    },
    onSuccess: (data) => {
      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    },
    onError: (err: any) => {
      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: err.message || "Failed to get response. Please try again." },
      ]);
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    setConversation((prev) => [...prev, { role: "user", content: message }]);
    chatMutation.mutate(message);
    setMessage("");
  };

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold">AI Coach</h1>
        <p className="text-muted-foreground text-sm">Get personalized advice in Bangla & English</p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Your Life Coach</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[200px]">
            {conversation.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Ask your AI coach for advice on your progress.</p>
                <p className="text-xs mt-1">Try: "How am I doing this week?" or "Give me study tips"</p>
              </div>
            )}
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                  data-testid={`message-${msg.role}-${i}`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask your coach anything..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
              className="resize-none"
              data-testid="textarea-coach-message"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || chatMutation.isPending}
              data-testid="button-send-coach"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
