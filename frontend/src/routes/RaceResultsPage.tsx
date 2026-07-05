import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trophy } from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useRaceRoomAgent } from "../hooks/useRaceRoomAgent";
import { racesApi } from "../lib/races";
import { racersToLiveResults } from "../lib/liveResults";
import { LeaderboardTable } from "../components/race/LeaderboardTable";
import { Confetti } from "../components/race/Confetti";
import { Button } from "../components/ui/Button";
import { PageFade } from "../components/ui/PageFade";
import type { Race, RaceResult } from "../types/race";

export function RaceResultsPage() {
  const { raceId } = useParams<{ raceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [race, setRace] = useState<Race | null>(null);
  const [results, setResults] = useState<RaceResult[] | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const hasCelebrated = useRef(false);

  const { state } = useRaceRoomAgent(raceId!, user!.id);

  useEffect(() => {
    if (!raceId) return;
    racesApi.get(raceId).then(setRace);
  }, [raceId]);

  useEffect(() => {
    if (race?.status === "FINISHED") {
      racesApi.results(raceId!).then(setResults);
    }
  }, [race?.status, raceId]);

  useEffect(() => {
    if (!results || hasCelebrated.current) return;
    const mine = results.find((r) => r.userId === user?.id);
    if (mine?.rank === 1) {
      hasCelebrated.current = true;
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [results, user?.id]);

  if (!race) return <div className="safe-top flex min-h-[100dvh] items-center justify-center text-text-muted">Loading...</div>;

  const liveResults: RaceResult[] = state ? racersToLiveResults(Object.values(state.racers), race.id) : [];
  const finalResults = results ?? liveResults;
  const myResult = finalResults.find((r) => r.userId === user?.id);
  const isWinner = myResult?.rank === 1;

  return (
    <PageFade className="safe-top safe-bottom flex min-h-[100dvh] flex-col px-5 pt-6">
      {showConfetti && <Confetti />}

      <div className="mb-5 flex flex-col items-center text-center">
        <div
          className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: isWinner ? "color-mix(in srgb, var(--color-accent) 20%, transparent)" : "rgba(255,255,255,0.06)" }}
        >
          <Trophy size={32} weight="fill" style={{ color: isWinner ? "var(--color-accent)" : "var(--color-text-muted)" }} />
        </div>
        <h1 className="text-2xl font-semibold text-text">{race.name}</h1>
        {isWinner ? (
          <p className="mt-1 text-[14px] font-medium text-accent">You won this one</p>
        ) : (
          <p className="mt-1 text-[14px] text-text-muted">Race results</p>
        )}
      </div>

      <LeaderboardTable results={finalResults} currentUserId={user?.id} />

      <div className="flex-1" />
      <Button fullWidth className="mb-4 mt-6" onClick={() => navigate("/")}>
        Back to races
      </Button>
    </PageFade>
  );
}
