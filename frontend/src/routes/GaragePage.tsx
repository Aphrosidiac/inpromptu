import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CarProfile, Plus, CaretLeft, CheckCircle } from "@phosphor-icons/react";
import { carsApi } from "../lib/cars";
import { resolveImageUrl } from "../lib/api";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { PageFade } from "../components/ui/PageFade";
import { StaggerContainer, StaggerItem } from "../components/ui/Stagger";
import type { Car } from "../types/car";

export function GaragePage() {
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[] | null>(null);

  useEffect(() => {
    carsApi.list().then(setCars).catch(() => setCars([]));
  }, []);

  return (
    <PageFade className="safe-top safe-bottom flex flex-col gap-5 px-5 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/profile")} aria-label="Back">
          <CaretLeft size={22} className="text-text-muted" />
        </button>
        <h1 className="text-2xl font-semibold text-text">My garage</h1>
      </div>

      {cars === null && <p className="text-text-muted">Loading...</p>}

      {cars?.length === 0 && (
        <EmptyState
          icon={<CarProfile size={26} />}
          title="No cars yet"
          description="Add a car and it'll show up whenever you race."
          action={
            <Button onClick={() => navigate("/garage/new")} icon={<Plus size={18} />}>
              Add a car
            </Button>
          }
        />
      )}

      <StaggerContainer className="flex flex-col gap-5">
        {cars?.map((car) => (
          <StaggerItem key={car.id}>
            <Link
              to={`/garage/${car.id}`}
              className="glass flex items-center gap-4 rounded-card p-3 transition-transform active:scale-[0.98]"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-input bg-white/5">
                {car.photoUrl && (
                  <img src={resolveImageUrl(car.photoUrl)} alt={car.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-medium text-text">{car.name}</span>
                  {car.isActive && <CheckCircle size={15} weight="fill" className="text-accent" />}
                </div>
                <span className="text-[13px] text-text-muted">
                  {[car.year, car.make, car.model].filter(Boolean).join(" ") || "No details yet"}
                </span>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {cars && cars.length > 0 && (
        <Button variant="glass" icon={<Plus size={18} />} onClick={() => navigate("/garage/new")}>
          Add another car
        </Button>
      )}
    </PageFade>
  );
}
