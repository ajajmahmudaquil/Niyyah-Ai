import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/verify-email", { token: token.trim() });
      const data = await res.json();
      setVerified(true);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: t("auth.emailVerified"), description: data.message });
    } catch (err: any) {
      toast({ title: t("auth.verificationFailed"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await apiRequest("POST", "/api/auth/resend-verification");
      const data = await res.json();
      toast({ title: t("auth.verificationSent"), description: data.token ? `Dev token: ${data.token}` : data.message });
    } catch (err: any) {
      toast({ title: "Failed to resend", description: err.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background islamic-pattern-bg p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
          <h1 className="text-2xl font-bold">{t("auth.emailVerified")}</h1>
          <p className="text-muted-foreground">{t("auth.emailVerifiedDesc")}</p>
          <Button onClick={() => window.location.href = "/dashboard"} className="rounded-lg" data-testid="button-go-dashboard">
            {t("auth.goToDashboard")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background islamic-pattern-bg p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <Mail className="w-14 h-14 mx-auto text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("auth.verifyEmail")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("auth.verifyEmailDesc")} <strong>{user?.email}</strong>.
              {" "}{t("auth.verifyEmailCheck")}
            </p>
          </div>
        </div>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">{t("auth.verificationCode")}</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder={t("auth.verificationPlaceholder")}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-verification-token"
                />
              </div>
              <Button type="submit" className="w-full rounded-lg" disabled={loading} data-testid="button-verify">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("auth.verifyBtn")}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={resending}
                data-testid="button-resend-verification"
              >
                {resending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                {t("auth.resendVerification")}
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-[11px] text-muted-foreground/60">
          {t("app.tagline")}
        </p>
      </div>
    </div>
  );
}
