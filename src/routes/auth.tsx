import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { BrandMark } from "@/components/app/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initAuth, useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { mode?: Mode | undefined; redirect?: string | undefined } => {
    const mode = s["mode"];
    const redirect = s["redirect"];
    return {
      mode: mode === "signup" || mode === "forgot" ? mode : undefined,
      // only same-site paths, never "//evil.com"
      redirect:
        typeof redirect === "string" && /^\/(?![/\\])/.test(redirect) ? redirect : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Sign in — Trinova Vendor Scorecard" },
      { name: "description", content: "Sign in or create your company account." },
    ],
  }),
  component: AuthPage,
});

/** Turns Supabase auth errors into plain language. */
export function authMessage(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Wrong email or password.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email first. Check your inbox for the link.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Sign in instead.";
  if (m.includes("password should be")) return "Password must be at least 8 characters.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Wait a minute and try again.";
  if (m.includes("failed to fetch")) return "Can't reach the server. Check your connection.";
  return message;
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [sentTo, setSentTo] = useState<{ email: string; kind: "confirm" | "reset" } | null>(null);
  const target = search.redirect ?? "/dashboard";

  useEffect(() => initAuth(), []);
  useEffect(() => {
    if (auth.status === "signed-in") void navigate({ to: target });
  }, [auth.status, navigate, target]);

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1fr_1.1fr]">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden overflow-hidden bg-hero p-12 text-primary-foreground lg:flex lg:flex-col">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark className="h-10 w-10 rounded-[11px] ring-1 ring-white/15" />
          <span className="font-display text-[15px] font-bold">Trinova Analytics</span>
        </Link>
        <div className="mt-auto max-w-md">
          <h2 className="text-4xl font-bold leading-tight">From gut feel to data.</h2>
          <p className="mt-4 text-base leading-relaxed opacity-80">
            Score every vendor on on-time-in-full delivery, safety and HSE compliance, and see who
            is slipping before it costs you.
          </p>
          <ul className="mt-8 space-y-3 text-sm opacity-90">
            {[
              "Your company's data stays private to your team",
              "Works on phone, tablet and desktop",
              "Automatic tiers and early warnings",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" className="flex items-center gap-2.5 lg:hidden">
            <BrandMark className="h-9 w-9 rounded-[10px]" />
            <span className="font-display text-[15px] font-bold">Trinova</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-sm py-10">
          {auth.status === "unconfigured" ? (
            <Notice title="Sign-in isn't set up yet">
              Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the project's .env file.
            </Notice>
          ) : sentTo ? (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/12 text-accent">
                <MailCheck className="h-7 w-7" />
              </span>
              <h1 className="mt-5 text-2xl font-bold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a {sentTo.kind === "confirm" ? "confirmation" : "password reset"} link to{" "}
                <span className="font-medium text-foreground">{sentTo.email}</span>. Open it on this
                device to continue.
              </p>
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => {
                  setSentTo(null);
                  setMode("signin");
                }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              {mode !== "forgot" && (
                <div className="mb-6">
                  <h1 className="text-[26px] font-bold">
                    {mode === "signin" ? "Welcome back" : "Create your account"}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mode === "signin"
                      ? "Sign in to your company's scoreboard."
                      : "Set up your company. You'll be its owner."}
                  </p>
                </div>
              )}
              {mode !== "forgot" && (
                <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm">
                  {(["signin", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={cn(
                        "rounded-lg py-2 font-medium transition",
                        mode === m ? "bg-card shadow-card" : "text-muted-foreground",
                      )}
                    >
                      {m === "signin" ? "Sign in" : "Create account"}
                    </button>
                  ))}
                </div>
              )}
              {mode !== "forgot" && <GoogleButton redirect={target} />}
              {mode === "signin" && <SignIn onForgot={() => setMode("forgot")} />}
              {mode === "signup" && (
                <SignUp onSent={(email) => setSentTo({ email, kind: "confirm" })} />
              )}
              {mode === "forgot" && (
                <Forgot
                  onBack={() => setMode("signin")}
                  onSent={(email) => setSentTo({ email, kind: "reset" })}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (e: FormEvent, fn: () => Promise<void>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(authMessage((err as Error).message));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint}
      </div>
      {children}
    </div>
  );
}

function PasswordInput(props: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={props.id}
        type={show ? "text" : "password"}
        required
        minLength={8}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        className="h-11 pr-11"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function ErrorText({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </p>
  ) : null;
}

function Submit({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <Button type="submit" size="lg" className="h-11 w-full" disabled={busy}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

function GoogleButton({ redirect }: { redirect: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-11 w-full bg-card"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          const { error } = await supabase().auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}${redirect}` },
          });
          // On success the browser leaves for Google, so only errors land here.
          if (error) {
            setError(authMessage(error.message));
            setBusy(false);
          }
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleLogo />}
        Continue with Google
      </Button>
      <ErrorText error={error} />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or with email
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function SignIn({ onForgot }: { onForgot: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { busy, error, run } = useSubmit();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) =>
        run(e, async () => {
          const { error } = await supabase().auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (error) throw error;
        })
      }
    >
      <Field label="Email" htmlFor="auth-email">
        <Input
          id="auth-email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
        />
      </Field>
      <Field
        label="Password"
        htmlFor="auth-password"
        hint={
          <button
            type="button"
            onClick={onForgot}
            className="text-xs font-medium text-accent hover:underline"
          >
            Forgot password?
          </button>
        }
      >
        <PasswordInput
          id="auth-password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
      </Field>
      <ErrorText error={error} />
      <Submit busy={busy}>Sign in</Submit>
    </form>
  );
}

function SignUp({ onSent }: { onSent: (email: string) => void }) {
  const [f, setF] = useState({ fullName: "", company: "", email: "", password: "" });
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const { busy, error, run } = useSubmit();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) =>
        run(e, async () => {
          const { data, error } = await supabase().auth.signUp({
            email: f.email.trim(),
            password: f.password,
            options: {
              data: { full_name: f.fullName.trim(), company_name: f.company.trim() },
              emailRedirectTo: `${window.location.origin}/dashboard`,
            },
          });
          if (error) throw error;
          // Supabase returns a user with no identities when the email is already registered.
          if (data.user && data.user.identities?.length === 0)
            throw new Error("already registered");
          if (!data.session) onSent(f.email.trim());
        })
      }
    >
      <Field label="Your full name" htmlFor="auth-your-full-name">
        <Input
          id="auth-your-full-name"
          required
          autoComplete="name"
          value={f.fullName}
          onChange={(e) => set("fullName")(e.target.value)}
          className="h-11"
        />
      </Field>
      <Field label="Company name" htmlFor="auth-company-name">
        <Input
          id="auth-company-name"
          required
          autoComplete="organization"
          value={f.company}
          onChange={(e) => set("company")(e.target.value)}
          placeholder="e.g. Trinova Analytics Ltd"
          className="h-11"
        />
      </Field>
      <Field label="Work email" htmlFor="auth-work-email">
        <Input
          id="auth-work-email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={f.email}
          onChange={(e) => set("email")(e.target.value)}
          className="h-11"
        />
      </Field>
      <Field
        label="Password"
        htmlFor="auth-password"
        hint={<span className="text-xs text-muted-foreground">8+ characters</span>}
      >
        <PasswordInput
          id="auth-password"
          value={f.password}
          onChange={set("password")}
          autoComplete="new-password"
        />
      </Field>
      <ErrorText error={error} />
      <Submit busy={busy}>Create account</Submit>
    </form>
  );
}

function Forgot({ onBack, onSent }: { onBack: () => void; onSent: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const { busy, error, run } = useSubmit();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) =>
        run(e, async () => {
          const { error } = await supabase().auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (error) throw error;
          onSent(email.trim());
        })
      }
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </button>
      <div>
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll email you a link to choose a new one.
        </p>
      </div>
      <Field label="Email" htmlFor="auth-email">
        <Input
          id="auth-email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
        />
      </Field>
      <ErrorText error={error} />
      <Submit busy={busy}>Send reset link</Submit>
    </form>
  );
}
