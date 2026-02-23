import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function SetUsernamePage() {
  const { setUsername } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
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
        title: t("auth.failedSetUsername"),
        description: err.message || t("auth.usernameTaken"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background islamic-pattern-bg p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <img
            src="/logo.png"
            alt="Niyyah Logo"
            className="w-14 h-14 mx-auto object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("auth.chooseUsername")}</h1>
            <p className="text-muted-foreground text-sm">{t("auth.usernameIdentifier")}</p>
          </div>
        </div>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t("auth.username")}</Label>
                <Input
                  id="username"
                  placeholder={t("auth.usernamePlaceholder")}
                  value={username}
                  onChange={(e) => setUsernameValue(e.target.value)}
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  className="rounded-lg"
                  data-testid="input-username"
                />
                <p className="text-xs text-muted-foreground">
                  {t("auth.usernameHint")}
                </p>
              </div>
              <Button type="submit" className="w-full rounded-lg" disabled={loading} data-testid="button-set-username">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("auth.continue")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
