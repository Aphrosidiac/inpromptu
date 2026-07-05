import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lightning } from "@phosphor-icons/react";
import { useAuth, ApiError } from "../hooks/useAuth";
import { GlassCard } from "../components/ui/GlassCard";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(searchParams.get("redirect") || "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="safe-top safe-bottom flex min-h-[100dvh] flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Lightning size={28} weight="fill" />
        </div>
        <h1 className="text-2xl font-semibold text-text">Welcome back</h1>
        <p className="text-[14px] text-text-muted">Log in to race your friends</p>
      </div>

      <GlassCard className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <Input
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth disabled={isSubmitting} className="mt-2">
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </GlassCard>

      <p className="mt-6 text-[14px] text-text-muted">
        Need an account?{" "}
        <Link
          to={searchParams.get("redirect") ? `/signup?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : "/signup"}
          className="font-medium text-accent"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
