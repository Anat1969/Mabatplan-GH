import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LayoutDashboard, FilePlus, FileText, ClipboardList } from "lucide-react";

const ARCHITECT_NAV = [
  { path: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { path: "/project/new", label: "תוכנית חדשה", icon: FilePlus },
];

const REVIEWER_NAV = [
  { path: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { path: "/reviewer-dashboard", label: "לוח בוחנים", icon: ClipboardList },
];

export default function Layout() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isReviewer = currentUser?.role === "reviewer";
  const navItems = isReviewer ? REVIEWER_NAV : ARCHITECT_NAV;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">תכנית</h1>
                <p className="text-[10px] text-muted-foreground leading-none">מערכת הוראות תוכנית</p>
              </div>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
              {currentUser?.role === "admin" && (
                <Link
                  to="/reviewer-dashboard"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith("/reviewer") || location.pathname.startsWith("/review/")
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span className="hidden sm:inline">לוח בוחנים</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}