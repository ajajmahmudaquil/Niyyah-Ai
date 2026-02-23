import { useLocation, Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import {
  LayoutDashboard,
  Compass,
  Code2,
  Target,
  Wallet,
  Bot,
} from "lucide-react";

export function MobileNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { title: t("nav.home"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.prayers"), url: "/prayers", icon: Compass },
    { title: t("nav.problems"), url: "/problems", icon: Code2 },
    { title: t("nav.targets"), url: "/targets", icon: Target },
    { title: t("nav.finance"), url: "/finance", icon: Wallet },
    { title: t("nav.coach"), url: "/coach", icon: Bot },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              data-testid={`mobile-nav-${item.url.slice(1)}`}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-tight">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
