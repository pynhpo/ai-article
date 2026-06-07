import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User as UserIcon, LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, onLogout, openLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAccountPage = location.pathname === "/account";

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {isAccountPage ? (
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Back to Home
          </button>
        ) : (
          <span
            className="text-xs font-semibold uppercase tracking-wider text-foreground hover:opacity-80 cursor-default"
          >
            AI Article Generation
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user?.isGuest ? (
          <>
            <span className="rounded-full border border-border bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Guest Session
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={openLogin}
              className="h-8 gap-1.5 rounded-lg text-xs cursor-pointer"
            >
              <LogIn className="size-3.5 text-muted-foreground" />
              Sign In
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/account")}
              className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <UserIcon className="size-3.5 text-muted-foreground" />
              {user?.username || user?.email?.split("@")[0] || "Profile"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-8 gap-1.5 rounded-lg text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
