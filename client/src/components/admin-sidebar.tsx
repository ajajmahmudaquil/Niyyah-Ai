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
  Users,
  BarChart3,
  Shield,
  LogOut,
  Sun,
  Moon as MoonIcon,
  ArrowLeft,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export function AdminSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const adminNavItems = [
    { title: t("nav.overview"), url: "/admin", icon: LayoutDashboard },
    { title: t("nav.users"), url: "/admin/users", icon: Users },
    { title: t("nav.analytics"), url: "/admin/analytics", icon: BarChart3 },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center">
            <Shield className="w-4 h-4 text-destructive-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight">{t("admin.adminPanel")}</h2>
            <p className="text-[10px] text-muted-foreground">
              {user?.username || user?.email}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.administration")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    data-active={
                      item.url === "/admin"
                        ? location === "/admin"
                        : location.startsWith(item.url)
                    }
                  >
                    <Link href={item.url} data-testid={`nav-admin-${item.url.split("/").pop()}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 space-y-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" data-testid="link-back-to-app">
            <ArrowLeft className="w-4 h-4" />
            {t("nav.backToApp")}
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLanguage(language === "en" ? "bn" : "en")}
            className="text-xs px-2"
            data-testid="button-admin-lang"
          >
            {language === "en" ? "বাংলা" : "EN"}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-admin-theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout()}
            data-testid="button-admin-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
