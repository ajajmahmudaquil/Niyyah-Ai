import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";
import { isDisposableEmail } from "@/lib/disposableDomains";
import { useTranslation, useLanguage } from "@/lib/i18n";

export default function SignupPage() {
  const { signup } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({ title: t("auth.fullNameRequired"), variant: "destructive" });
      return;
    }

    if (isDisposableEmail(email)) {
      toast({ title: t("auth.disposableEmail"), variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: t("auth.passwordsDontMatch"), variant: "destructive" });
      return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      toast({ title: t("auth.passwordStrengthFail"), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, fullName.trim());
      setLocation("/set-username");
    } catch (err: any) {
      toast({
        title: t("auth.signupFailed"),
        description: err.message || t("auth.couldNotCreate"),
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
            <h1 className="text-2xl font-bold tracking-tight">{t("auth.createAccount")}</h1>
            <p className="text-muted-foreground text-sm">{t("auth.beginJourney")}</p>
          </div>
        </div>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t("auth.fullNamePlaceholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-full-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.strongPasswordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-password"
                />
                {password && <PasswordStrengthMeter password={password} />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-confirm-password"
                />
              </div>
              <Button type="submit" className="w-full rounded-lg" disabled={loading} data-testid="button-signup">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("auth.createAccountBtn")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="text-primary font-medium" data-testid="link-login">
            {t("auth.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
