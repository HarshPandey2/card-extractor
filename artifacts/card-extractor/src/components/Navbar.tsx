import { Link, useLocation } from "wouter";
import { Shield, ScanLine, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/hooks/use-admin";

export function Navbar() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");
  const isAuthenticated = !!localStorage.getItem("adminToken");

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

        <div className="flex items-center gap-4">
          {!isAdmin ? (
            <Link 
              href="/admin" 
              className={cn(
                "group flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-2 text-sm font-medium transition-all hover:bg-secondary hover:shadow-sm",
                "text-secondary-foreground"
              )}
            >
              <Shield className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Admin</span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to App
              </Link>
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
