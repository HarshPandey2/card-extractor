import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Lock, Mail, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, useAuthLogin } from "@workspace/api-client-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { mutate: doLogin, isPending } = useAuthLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    doLogin(
      { data: { email: normalizedEmail, password: normalizedPassword } },
      {
        onSuccess: (res) => {
          login(res.token, {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            role: res.user.role as "user" | "admin",
            isVerified: res.user.isVerified,
          });
          setLocation("/");
        },
        onError: (error) => {
          const message =
            error instanceof ApiError && error.data && typeof error.data === "object"
              ? String((error.data as { message?: string }).message || "")
              : "";
          setErrorMsg(message || "Invalid email or password. Please try again.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl opacity-50 absolute -top-40 -left-40" />
        <div className="w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl opacity-50 absolute bottom-0 right-0" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl shadow-primary/20">
            <Lock className="h-8 w-8" />
          </div>
        </div>
        <h2 className="text-center font-display text-3xl font-bold tracking-tight text-foreground">
          Client login
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Sign in with the configured client account to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150">
        <div className="bg-card py-8 px-4 shadow-2xl shadow-black/5 border border-border sm:rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive border border-destructive/20 animate-in fade-in">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="group w-full flex justify-center items-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-r-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="mt-3 text-sm text-muted-foreground">
              Are you an admin?{" "}
              <Link href="/admin/login" className="font-semibold text-primary hover:underline underline-offset-4">
                Use admin login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
