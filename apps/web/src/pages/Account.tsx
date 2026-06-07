import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Account() {
  const { user, onLogout, openLogin } = useAuth();
  const navigate = useNavigate();

  if (user?.isGuest) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-border bg-muted">
            <Shield className="size-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign In Required</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              To view account settings, please sign in or create an account.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="h-11 w-full rounded-xl font-bold shadow-lg" onClick={openLogin}>
              Sign In
            </Button>
            <button
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Content */}
      <div className="flex-1 overflow-auto p-6 md:p-12">
        <div className="mx-auto max-w-2xl space-y-12">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Account</h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile and account preferences.
            </p>
          </div>

          {/* Profile Section */}
          <section className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Profile Information
            </h2>
            <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full border border-border bg-muted text-xl font-bold text-foreground">
                  {user?.username?.substring(0, 1).toUpperCase() ||
                    user?.email?.substring(0, 1).toUpperCase() ||
                    "U"}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">{user?.username || ""}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Username
                  </label>
                  <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                    {user?.username || "Not set"}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Email Address
                  </label>
                  <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Account Actions */}
          <section className="space-y-6 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Account Actions
            </h2>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="h-12 w-full justify-start gap-3 rounded-xl"
                onClick={() => {}}
              >
                <Shield className="size-4 text-muted-foreground" />
                Security Settings
              </Button>
              <Button
                variant="outline"
                className="h-12 w-full justify-start gap-3 rounded-xl border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onLogout}
              >
                <LogOut className="size-4" />
                Sign Out
              </Button>
            </div>
          </section>

          {/* Footer Info */}
          <div className="pt-12 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              AI Article Generation &copy; 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
