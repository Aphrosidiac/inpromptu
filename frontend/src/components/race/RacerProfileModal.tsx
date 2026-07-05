import { useEffect, useState } from "react";
import { Users, Flag, Trophy, Gauge, CheckCircle } from "@phosphor-icons/react";
import { usersApi, type PublicProfile } from "../../lib/users";
import { resolveImageUrl } from "../../lib/api";
import { BottomSheet } from "../ui/BottomSheet";
import { StatCard } from "../ui/StatCard";
import { Avatar } from "../ui/Avatar";

// Shown when tapping a racer's marker on the live map or in a race -- a quick-glance profile
// card (stats + garage) rather than a full page, since it's meant to be dismissed and get back
// to the map immediately.
export function RacerProfileModal({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setProfile(null);
    setLoadFailed(false);
    usersApi
      .profile(userId)
      .then(setProfile)
      .catch(() => setLoadFailed(true));
  }, [userId]);

  return (
    <BottomSheet open={!!userId} onClose={onClose} title={profile?.displayName ?? "Racer"}>
      <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto">
        {loadFailed && <p className="text-[14px] text-danger">Couldn't load this racer's profile.</p>}
        {!profile && !loadFailed && <p className="text-[14px] text-text-muted">Loading...</p>}

        {profile && (
          <>
            <div className="flex items-center gap-3">
              <Avatar name={profile.displayName} imageUrl={profile.avatarUrl} size={48} />
              <span className="text-[16px] font-medium text-text">{profile.displayName}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Users size={16} />} label="Races joined" value={String(profile.stats.racesJoined)} />
              <StatCard icon={<Flag size={16} />} label="Finished" value={String(profile.stats.racesFinished)} />
              <StatCard icon={<Trophy size={16} />} label="Wins" value={String(profile.stats.wins)} />
              <StatCard
                icon={<Gauge size={16} />}
                label="Best avg speed"
                value={profile.stats.bestSpeedKmh ? profile.stats.bestSpeedKmh.toFixed(1) : "-"}
                unit={profile.stats.bestSpeedKmh ? "km/h" : undefined}
              />
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-medium text-text-muted">Garage</h3>
              {profile.cars.length === 0 && <p className="text-[13px] text-text-muted">No cars yet.</p>}
              {profile.cars.map((car) => (
                <div key={car.id} className="glass flex items-center gap-3 rounded-card p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-input bg-white/5">
                    {car.photoUrl && (
                      <img
                        src={resolveImageUrl(car.photoUrl)}
                        alt={car.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-medium text-text">{car.name}</span>
                      {car.isActive && <CheckCircle size={13} weight="fill" className="text-accent" />}
                    </div>
                    <span className="text-[12px] text-text-muted">
                      {[car.year, car.make, car.model].filter(Boolean).join(" ") || "No details yet"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
