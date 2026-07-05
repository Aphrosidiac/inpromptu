import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  SignOut,
  Flag,
  Trophy,
  Gauge,
  Timer,
  MapTrifold,
  Users,
  Lightning,
  Star,
  Camera,
  CarProfile,
  CaretRight,
} from "@phosphor-icons/react";
import clsx from "clsx";
import { useAuth } from "../hooks/useAuth";
import { usersApi, type UserStats } from "../lib/users";
import { uploadImage } from "../lib/api";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { StatCard } from "../components/ui/StatCard";
import { Avatar } from "../components/ui/Avatar";

function formatElapsed(ms: number | null) {
  if (ms == null) return "-";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function buildAchievements(stats: UserStats) {
  return [
    { label: "First race", icon: Flag, earned: stats.racesJoined >= 1 },
    { label: "Finisher", icon: Timer, earned: stats.racesFinished >= 1 },
    { label: "First win", icon: Trophy, earned: stats.wins >= 1 },
    { label: "5 races", icon: Users, earned: stats.racesJoined >= 5 },
    { label: "Speed demon", icon: Lightning, earned: (stats.bestSpeedKmh ?? 0) >= 15 },
  ];
}

export function ProfilePage() {
  const { user, logout, updateAvatar } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usersApi.stats().then(setStats);
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { url } = await uploadImage(file);
      await updateAvatar(url);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="safe-top flex flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-semibold text-text">Profile</h1>

      <GlassCard className="flex items-center gap-4">
        <button
          type="button"
          className="relative shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Avatar name={user?.displayName ?? "?"} imageUrl={user?.avatarUrl} size={56} />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Camera size={13} weight="fill" />
          </span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        <div>
          <p className="text-[16px] font-medium text-text">{user?.displayName}</p>
          <p className="text-[13px] text-text-muted">{user?.email}</p>
        </div>
      </GlassCard>

      <Link
        to="/garage"
        className="glass flex items-center justify-between rounded-card p-4 transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
            <CarProfile size={18} weight="fill" />
          </div>
          <span className="text-[15px] font-medium text-text">My garage</span>
        </div>
        <CaretRight size={18} className="text-text-muted" />
      </Link>

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Users size={16} />} label="Races joined" value={String(stats.racesJoined)} />
            <StatCard icon={<Flag size={16} />} label="Finished" value={String(stats.racesFinished)} />
            <StatCard icon={<Trophy size={16} />} label="Wins" value={String(stats.wins)} />
            <StatCard
              icon={<Gauge size={16} />}
              label="Best avg speed"
              value={stats.bestSpeedKmh ? stats.bestSpeedKmh.toFixed(1) : "-"}
              unit={stats.bestSpeedKmh ? "km/h" : undefined}
            />
            <StatCard icon={<Timer size={16} />} label="Best time" value={formatElapsed(stats.bestElapsedMs)} />
            <StatCard
              icon={<MapTrifold size={16} />}
              label="Total distance"
              value={stats.totalDistanceKm.toFixed(1)}
              unit="km"
            />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[14px] font-medium text-text-muted">Achievements</h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {buildAchievements(stats).map(({ label, icon: Icon, earned }) => (
                <div
                  key={label}
                  className={clsx(
                    "flex min-w-[84px] flex-col items-center gap-1.5 rounded-card p-3",
                    earned ? "glass" : "border border-white/5 opacity-40"
                  )}
                >
                  <Icon size={22} weight="fill" className={earned ? "text-accent" : "text-text-muted"} />
                  <span className="text-center text-[11px] text-text-muted">{label}</span>
                  {earned && <Star size={10} weight="fill" className="text-accent" />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Button variant="glass" icon={<SignOut size={18} />} onClick={() => logout()}>
        Log out
      </Button>
    </div>
  );
}
