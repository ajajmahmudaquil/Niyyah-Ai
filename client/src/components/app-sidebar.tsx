import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { useTranslation, useLanguage } from "@/lib/i18n";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Moon as MoonIcon,
  Compass,
  Code2,
  StickyNote,
  Target,
  Bot,
  Wallet,
  Settings,
  Shield,
  LogOut,
  Sun,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const navItems = [
    { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.prayers"), url: "/prayers", icon: Compass },
    { title: t("nav.problems"), url: "/problems", icon: Code2 },
    { title: t("nav.notes"), url: "/notes", icon: StickyNote },
    { title: t("nav.targets"), url: "/targets", icon: Target },
    { title: t("nav.coach"), url: "/coach", icon: Bot },
    { title: t("nav.finance"), url: "/finance", icon: Wallet },
    { title: t("nav.settings"), url: "/settings", icon: Settings },
  ];

  const firstName = user?.fullName
    ? user.fullName.split(" ")[0]
    : "";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <img
              src="/logo.png"
              alt="Niyyah Logo"
              className="w-8 h-8 rounded-lg object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-sm">☪</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-sm tracking-tight">Niyyah</h2>
            <p className="text-[11px] font-medium truncate overflow-hidden whitespace-nowrap" data-testid="sidebar-fullname">
              {user?.fullName || firstName}
            </p>
            {user?.username && (
              <p className="text-[10px] text-muted-foreground truncate overflow-hidden whitespace-nowrap" data-testid="sidebar-username">
                @{user.username}
              </p>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                  >
                    <Link href={item.url} data-testid={`nav-${item.url.slice(1)}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("nav.administration")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    data-active={location.startsWith("/admin")}
                  >
                    <Link href="/admin" data-testid="nav-admin">
                      <Shield className="w-4 h-4" />
                      <span>{t("nav.admin")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLanguage(language === "en" ? "bn" : "en")}
            className="text-xs px-2"
            data-testid="button-sidebar-lang"
          >
            {language === "en" ? "বাংলা" : "EN"}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
