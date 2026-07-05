import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FlagCheckered, MapTrifold, Users } from "@phosphor-icons/react";
import { useAuth, ApiError } from "../hooks/useAuth";
import { racesApi, type RacePreview } from "../lib/races";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { PageFade } from "../components/ui/PageFade";

export function JoinRacePage() {
  const { raceId } = useParams<{ raceId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<RacePreview | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!raceId) return;
    racesApi.preview(raceId).then(setPreview).catch(() => setNotFound(true));
  }, [raceId]);

  async function handleJoin() {
    if (!raceId) return;
    setError(null);
    setIsJoining(true);
    try {
      await racesApi.join(raceId);
      navigate(`/races/${raceId}/lobby`);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? "This race has already started" : "Could not join this race");
    } finally {
      setIsJoining(false);
    }
  }

  if (notFound) {
    return (
      <div className="safe-top flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <p className="text-text">This race invite is no longer valid.</p>
      </div>
    );
  }

  if (!preview) {
    return <div className="safe-top flex min-h-[100dvh] items-center justify-center text-text-muted">Loading...</div>;
  }

  const redirect = `/join/${raceId}`;

  return (
    <PageFade className="safe-top safe-bottom flex min-h-[100dvh] flex-col items-center justify-center px-6">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
        <FlagCheckered size={28} weight="fill" />
      </div>
      <p className="mb-1 text-[13px] text-text-muted">{preview.hostName} invited you to</p>
      <h1 className="mb-6 text-center text-2xl font-semibold text-text">{preview.name}</h1>

      <GlassCard className="mb-6 w-full max-w-sm">
        <div className="flex items-center gap-3 py-1">
          <MapTrifold size={20} className="text-text-muted" />
          <span className="text-[14px] text-text">{(preview.distanceMeters / 1000).toFixed(1)} km</span>
        </div>
        <div className="mt-2 flex items-center gap-3 py-1">
          <Users size={20} className="text-text-muted" />
          <span className="text-[14px] text-text">{preview.participantCount} joined</span>
        </div>
      </GlassCard>

      {error && <p className="mb-3 text-[13px] text-danger">{error}</p>}

      {preview.status === "FINISHED" ? (
        <Button fullWidth className="max-w-sm" onClick={() => navigate(`/races/${raceId}/results`)}>
          View results
        </Button>
      ) : preview.status !== "LOBBY" && preview.status !== "DRAFT" ? (
        <p className="text-[14px] text-text-muted">This race has already started.</p>
      ) : authLoading ? null : user ? (
        <Button fullWidth className="max-w-sm" disabled={isJoining} onClick={handleJoin}>
          {isJoining ? "Joining..." : "Join race"}
        </Button>
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button fullWidth onClick={() => navigate(`/signup?redirect=${encodeURIComponent(redirect)}`)}>
            Sign up to join
          </Button>
          <Button
            fullWidth
            variant="glass"
            onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`)}
          >
            Log in to join
          </Button>
        </div>
      )}
    </PageFade>
  );
}
