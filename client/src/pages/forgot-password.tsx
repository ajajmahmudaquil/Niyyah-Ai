import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { identifier });
      const data = await res.json();
      setSent(true);
      toast({
        title: t("auth.requestSent"),
        description: data.message,
      });
    } catch (err: any) {
      toast({
        title: t("auth.error"),
        description: err.message || t("auth.somethingWentWrong"),
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
            <h1 className="text-2xl font-bold tracking-tight">{t("auth.resetPassword")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("auth.resetPasswordDesc")}
            </p>
          </div>
        </div>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("auth.resetTokenGenerated")}
                </p>
                <Link href="/reset-password">
                  <Button variant="outline" className="w-full rounded-lg" data-testid="button-go-reset">
                    {t("auth.haveResetToken")}
                  </Button>
                </Link>
              </div>
            ) : (
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
                    data-testid="input-forgot-identifier"
                  />
                </div>
                <Button type="submit" className="w-full rounded-lg" disabled={loading} data-testid="button-reset-request">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("auth.requestReset")}
                </Button>
              </form>
            )}
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
