import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useTranslation, useLanguage } from "@/lib/i18n";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(identifier, password);
      setLocation("/dashboard");
    } catch (err: any) {
      toast({
        title: t("auth.loginFailed"),
        description: err.message || t("auth.invalidCredentials"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background islamic-pattern-bg p-4 relative">
      <div className="absolute top-4 right-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLanguage(language === "en" ? "bn" : "en")}
          className="text-xs px-3 rounded-lg"
          data-testid="button-language-toggle"
        >
          {language === "en" ? "বাংলা" : "EN"}
        </Button>
      </div>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <img
            src="/logo.png"
            alt="Niyyah Logo"
            className="w-14 h-14 mx-auto object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("auth.welcomeBack")}</h1>
            <p className="text-muted-foreground text-sm">{t("auth.signInTo")}</p>
          </div>
        </div>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">{t("auth.emailOrUsername")}</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={t("auth.emailOrUsernamePlaceholder")}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-identifier"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline" data-testid="link-forgot-password">
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-password"
                />
              </div>
              <Button type="submit" className="w-full rounded-lg" disabled={loading} data-testid="button-login">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("auth.signIn")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link href="/signup" className="text-primary font-medium" data-testid="link-signup">
            {t("auth.signUp")}
          </Link>
        </p>
        <p className="text-center text-[11px] text-muted-foreground/60">
          {t("app.tagline")}
        </p>
      </div>
    </div>
  );
}
