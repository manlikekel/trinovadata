import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/app/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initAuth, useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { authMessage } from "./auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Choose a new password — Trinova Vendor Scorecard" }] }),
  component: ResetPassword,
});

/** Landing page for the password-reset email link. Supabase signs the user in from the link. */
function ResetPassword() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => initAuth(), []);

  const linked = auth.status === "signed-in" || auth.status === "no-company";

  return (
    <div className="pt-safe grid min-h-dvh place-items-center bg-background px-5">
      <div className="w-full max-w-sm py-10">
        <BrandLogo className="mx-auto h-24" />
        {auth.status === "loading" ? (
          <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-muted-foreground" />
        ) : !linked ? (
          <div className="mt-6 text-center">
            <h1 className="text-2xl font-bold">Link expired</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This reset link is no longer valid. Request a new one.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/auth" search={{ mode: "forgot" }}>
                Send a new link
              </Link>
            </Button>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (password !== confirm) {
                setError("The passwords don't match.");
                return;
              }
              setBusy(true);
              const { error } = await supabase().auth.updateUser({ password });
              setBusy(false);
              if (error) {
                setError(authMessage(error.message));
                return;
              }
              toast.success("Password updated");
              void navigate({ to: "/dashboard" });
            }}
          >
            <div className="text-center">
              <h1 className="text-2xl font-bold">Choose a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">For {auth.user?.email}</p>
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Repeat new password</Label>
              <Input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-11"
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="h-11 w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Save password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
