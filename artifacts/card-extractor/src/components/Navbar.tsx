import { Link, useLocation } from "wouter";
import { Shield, ScanLine, LogOut, User, ChevronDown, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const isAdminPage = location.startsWith("/admin");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105 active:scale-95">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20">
            <ScanLine className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Nexus<span className="text-primary">Extract</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {isAdmin && !isAdminPage && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-2 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary hover:shadow-sm"
                >
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  <span>Admin</span>
                </Link>
              )}
              {isAdminPage && (
                <Link
                  href="/"
                  className="hidden sm:flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to App
                </Link>
              )}

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium transition-all hover:bg-secondary",
                    dropdownOpen && "bg-secondary"
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate">{user?.name}</span>
                  {isAdmin && (
                    <span className="hidden sm:block text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                      Admin
                    </span>
                  )}
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                      >
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/admin/login"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-secondary hover:shadow-sm"
              >
                Admin Login
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-secondary hover:shadow-sm"
              >
                Client Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
