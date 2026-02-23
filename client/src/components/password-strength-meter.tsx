import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  // Check individual requirements
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
    password
  );

  const requirements = [
    { label: "At least 8 characters", met: hasMinLength },
    { label: "Uppercase letter", met: hasUppercase },
    { label: "Lowercase letter", met: hasLowercase },
    { label: "Number", met: hasNumber },
    { label: "Special character", met: hasSpecialChar },
  ];

  const metCount = requirements.filter((req) => req.met).length;

  // Determine strength level
  let strength: "weak" | "medium" | "strong";
  let widthPercent: number;
  let barColorClass: string;

  if (password.length < 8 || metCount < 3) {
    strength = "weak";
    widthPercent = 25;
    barColorClass = "bg-destructive";
  } else if (password.length >= 10 && metCount === 5) {
    strength = "strong";
    widthPercent = 100;
    barColorClass = "bg-primary";
  } else {
    // Medium: length >= 8 AND 3-4 requirements met
    strength = "medium";
    widthPercent = 60;
    barColorClass = "bg-accent";
  }

  const strengthLabel =
    strength.charAt(0).toUpperCase() + strength.slice(1);

  return (
    <div data-testid="password-strength-meter" className="space-y-3">
      {/* Progress bar with label */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full ${barColorClass} transition-all duration-300`}
              style={{ width: `${widthPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium transition-colors duration-300 min-w-fit">
            {strengthLabel}
          </span>
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        {requirements.map((req) => (
          <div
            key={req.label}
            className="flex items-center gap-2 text-xs transition-colors duration-300"
          >
            <div className="flex-shrink-0">
              {req.met ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <span
              className={`${
                req.met
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
