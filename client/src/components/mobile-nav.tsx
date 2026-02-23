import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Compass,
  Code2,
  StickyNote,
  Target,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Prayers", url: "/prayers", icon: Compass },
  { title: "Problems", url: "/problems", icon: Code2 },
  { title: "Notes", url: "/notes", icon: StickyNote },
  { title: "Targets", url: "/targets", icon: Target },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.url;
          return (
            <Link
              key={item.title}
              href={item.url}
              data-testid={`mobile-nav-${item.title.toLowerCase()}`}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
