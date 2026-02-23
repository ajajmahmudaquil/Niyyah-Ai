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

export default function SignupPage() {
  const { signup } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }

    if (isDisposableEmail(email)) {
      toast({ title: "Please use a real email address (disposable emails are not allowed).", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      toast({ title: "Password doesn't meet strength requirements", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, fullName.trim());
      setLocation("/set-username");
    } catch (err: any) {
      toast({
        title: "Signup failed",
        description: err.message || "Could not create account",
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
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground text-sm">Begin your journey of growth and accountability</p>
          </div>
        </div>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-full-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Strong password (8+ chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-password"
                />
                {password && <PasswordStrengthMeter password={password} />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-lg"
                  data-testid="input-confirm-password"
                />
              </div>
              <Button type="submit" className="w-full rounded-lg" disabled={loading} data-testid="button-signup">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium" data-testid="link-login">
            Sign in
          </Link>
        </p>
        <p className="text-center text-[11px] text-muted-foreground/60">
          Discipline. Growth. Accountability.
        </p>
      </div>
    </div>
  );
}
