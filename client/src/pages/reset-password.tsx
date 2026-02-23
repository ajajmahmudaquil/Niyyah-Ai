import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: t("auth.passwordsDontMatch"), variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", { token, newPassword });
      const data = await res.json();
      toast({ title: t("auth.passwordReset"), description: data.message });
      setLocation("/login");
    } catch (err: any) {
      toast({
        title: t("auth.resetFailed"),
        description: err.message || t("auth.invalidOrExpired"),
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
            <h1 className="text-2xl font-bold tracking-tight">{t("auth.setNewPassword")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("auth.setNewPasswordDesc")}
            </p>
          </div>
        </div>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">{t("auth.resetToken")}</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder={t("auth.resetTokenPlaceholder")}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-reset-token"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t("auth.newPasswordPlaceholder")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-confirm-password"
                />
              </div>
              <Button type="submit" className="w-full rounded-lg" disabled={loading} data-testid="button-reset-password">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("auth.resetPasswordBtn")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary font-medium inline-flex items-center gap-1" data-testid="link-back-login">
            <ArrowLeft className="w-3 h-3" /> {t("auth.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
