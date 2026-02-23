import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SetUsernamePage() {
  const { setUsername } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsernameValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setUsername(username);
      setLocation("/dashboard");
    } catch (err: any) {
      toast({
        title: "Failed to set username",
        description: err.message || "Username may already be taken",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-xl">L</span>
          </div>
          <h1 className="text-2xl font-bold">Choose your username</h1>
          <p className="text-muted-foreground text-sm">This will be your unique identifier on LifeOS</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="e.g. johndoe_123"
                  value={username}
                  onChange={(e) => setUsernameValue(e.target.value)}
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  data-testid="input-username"
                />
                <p className="text-xs text-muted-foreground">
                  3-20 characters. Letters, numbers, and underscores only.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading} data-testid="button-set-username">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
