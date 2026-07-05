import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flag, CaretRight } from "@phosphor-icons/react";
import { racesApi } from "../lib/races";
import { RaceCardSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { StaggerContainer, StaggerItem } from "../components/ui/Stagger";
import type { Race } from "../types/race";

const STATUS_TONE: Record<Race["status"], "neutral" | "accent" | "success"> = {
  DRAFT: "neutral",
  LOBBY: "accent",
  COUNTDOWN: "accent",
  ACTIVE: "accent",
  FINISHED: "success",
  CANCELLED: "neutral",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [races, setRaces] = useState<Race[] | null>(null);

  useEffect(() => {
    racesApi.list().then(setRaces);
  }, []);

  async function handleOpen(race: Race) {
    if (race.status === "FINISHED") {
      navigate(`/races/${race.id}/results`);
    } else if (race.status === "ACTIVE" || race.status === "COUNTDOWN") {
      navigate(`/races/${race.id}/live`);
    } else {
      await racesApi.join(race.id).catch(() => {});
      navigate(`/races/${race.id}/lobby`);
    }
  }

  return (
    <div className="safe-top flex flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-semibold text-text">Your races</h1>

      {races === null &&
        Array.from({ length: 3 }).map((_, i) => <RaceCardSkeleton key={i} />)}

      {races?.length === 0 && (
        <EmptyState
          icon={<Flag size={26} />}
          title="No races yet"
          description="Create a race and challenge your friends live."
          action={<Button onClick={() => navigate("/races/new")}>Create a race</Button>}
        />
      )}

      <StaggerContainer className="flex flex-col gap-5">
        {races?.map((race) => (
          <StaggerItem key={race.id}>
            <button
              onClick={() => handleOpen(race)}
              className="glass flex w-full items-center justify-between rounded-card p-4 text-left transition-transform active:scale-[0.98]"
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-[16px] font-medium text-text">{race.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-text-muted">
                    {(race.distanceMeters / 1000).toFixed(1)} km · {race.participants.length} joined
                  </span>
                  <Badge tone={STATUS_TONE[race.status]}>{race.status}</Badge>
                </div>
              </div>
              <CaretRight size={18} className="text-text-muted" />
            </button>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
