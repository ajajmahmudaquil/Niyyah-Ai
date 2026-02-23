import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider, useTranslation, useLanguage } from "@/lib/i18n";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";
import { usePageTracker } from "@/lib/tracker";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import SetUsernamePage from "@/pages/set-username";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import DashboardPage from "@/pages/dashboard";
import PrayersPage from "@/pages/prayers";
import ProblemsPage from "@/pages/problems";
import NotesPage from "@/pages/notes";
import TargetsPage from "@/pages/targets";
import CoachPage from "@/pages/coach";
import FinancePage from "@/pages/finance";
import SettingsPage from "@/pages/settings";
import VerifyEmailPage from "@/pages/verify-email";
import AdminOverviewPage from "@/pages/admin";
import AdminUsersPage from "@/pages/admin-users";
import AdminUserDetailPage from "@/pages/admin-user-detail";
import AdminAnalyticsPage from "@/pages/admin-analytics";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-header-theme">
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setLanguage(language === "en" ? "bn" : "en")}
      className="text-xs font-medium px-2"
      data-testid="button-language-toggle"
    >
      {language === "en" ? "বাংলা" : "EN"}
    </Button>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };
  const { user } = useAuth();

  const firstName = user?.fullName
    ? user.fullName.split(" ")[0]
    : user?.username || "";

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-2 border-b md:hidden">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm tracking-tight">Niyyah</span>
                  <span className="text-sm">☪</span>
                </div>
                <p className="text-xs font-medium truncate overflow-hidden whitespace-nowrap" data-testid="text-header-name">
                  {user?.fullName || firstName}
                </p>
                {user?.username && (
                  <p className="text-[10px] text-muted-foreground truncate overflow-hidden whitespace-nowrap" data-testid="text-header-username">
                    @{user.username}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <div className="pb-16 md:pb-0">
            <Footer />
          </div>
          <MobileNav />
        </div>
      </div>
    </SidebarProvider>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-2 border-b md:hidden">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-admin-sidebar-toggle" />
              <span className="text-sm font-bold text-destructive tracking-tight">Admin</span>
            </div>
            <div className="flex items-center gap-0.5">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!user.username && location !== "/set-username") {
    return <Redirect to="/set-username" />;
  }

  return (
    <AuthenticatedLayout>
      <Component />
    </AuthenticatedLayout>
  );
}

function AdminRoute({ component: Component, params }: { component: React.ComponentType<any>; params?: any }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;
  if (user.role !== "admin") return <Redirect to="/dashboard" />;

  return (
    <AdminLayout>
      <Component params={params} />
    </AdminLayout>
  );
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user && user.username) return <Redirect to="/dashboard" />;
  if (user && !user.username) return <Redirect to="/set-username" />;

  return <Component />;
}

function UsernameRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  if (user.username) return <Redirect to="/dashboard" />;
  return <SetUsernamePage />;
}

function PageTracker() {
  usePageTracker();
  return null;
}

function Router() {
  return (
    <>
      <PageTracker />
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/login">
          <PublicRoute component={LoginPage} />
        </Route>
        <Route path="/signup">
          <PublicRoute component={SignupPage} />
        </Route>
        <Route path="/forgot-password">
          <ForgotPasswordPage />
        </Route>
        <Route path="/reset-password">
          <ResetPasswordPage />
        </Route>
        <Route path="/set-username">
          <UsernameRoute />
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute component={DashboardPage} />
        </Route>
        <Route path="/prayers">
          <ProtectedRoute component={PrayersPage} />
        </Route>
        <Route path="/problems">
          <ProtectedRoute component={ProblemsPage} />
        </Route>
        <Route path="/notes">
          <ProtectedRoute component={NotesPage} />
        </Route>
        <Route path="/targets">
          <ProtectedRoute component={TargetsPage} />
        </Route>
        <Route path="/coach">
          <ProtectedRoute component={CoachPage} />
        </Route>
        <Route path="/finance">
          <ProtectedRoute component={FinancePage} />
        </Route>
        <Route path="/settings">
          <ProtectedRoute component={SettingsPage} />
        </Route>
        <Route path="/verify-email">
          <VerifyEmailPage />
        </Route>
        <Route path="/admin">
          <AdminRoute component={AdminOverviewPage} />
        </Route>
        <Route path="/admin/users">
          <AdminRoute component={AdminUsersPage} />
        </Route>
        <Route path="/admin/users/:userId">
          {(params) => <AdminRoute component={AdminUserDetailPage} params={params} />}
        </Route>
        <Route path="/admin/analytics">
          <AdminRoute component={AdminAnalyticsPage} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <AuthProvider>
              <Toaster />
              <Router />
            </AuthProvider>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
