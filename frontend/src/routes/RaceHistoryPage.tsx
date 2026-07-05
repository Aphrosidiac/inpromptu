import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClockCounterClockwise, Medal, CaretRight } from "@phosphor-icons/react";
import { racesApi } from "../lib/races";
import { RaceCardSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Badge } from "../components/ui/Badge";
import { StaggerContainer, StaggerItem } from "../components/ui/Stagger";
import type { Race, RaceResult } from "../types/race";

export function RaceHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<{ race: Race; result: RaceResult | null }[] | null>(null);

  useEffect(() => {
    racesApi.history().then(setHistory);
  }, []);

  return (
    <div className="safe-top flex flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-semibold text-text">Race history</h1>

      {history === null && Array.from({ length: 3 }).map((_, i) => <RaceCardSkeleton key={i} />)}

      {history?.length === 0 && (
        <EmptyState icon={<ClockCounterClockwise size={26} />} title="No finished races yet" />
      )}

      <StaggerContainer className="flex flex-col gap-5">
        {history?.map(({ race, result }) => (
          <StaggerItem key={race.id}>
            <button
              onClick={() => navigate(`/races/${race.id}/results`)}
              className="glass flex w-full items-center justify-between rounded-card p-4 text-left transition-transform active:scale-[0.98]"
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-[16px] font-medium text-text">{race.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-text-muted">{(race.distanceMeters / 1000).toFixed(1)} km</span>
                  {result?.didNotFinish ? (
                    <Badge tone="danger">DNF</Badge>
                  ) : result?.rank ? (
                    <Badge tone={result.rank === 1 ? "accent" : "neutral"}>
                      <Medal size={12} weight="fill" className="mr-1 inline" />
                      Rank {result.rank}
                    </Badge>
                  ) : null}
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
