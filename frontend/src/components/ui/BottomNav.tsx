import { NavLink } from "react-router-dom";
import { House, PlusCircle, ClockCounterClockwise } from "@phosphor-icons/react";
import clsx from "clsx";
import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "./Avatar";

const ITEMS = [
  { to: "/", label: "Races", icon: House },
  { to: "/races/new", label: "Create", icon: PlusCircle },
  { to: "/history", label: "History", icon: ClockCounterClockwise },
];

export function BottomNav() {
  const { user } = useAuth();

  return (
    <nav
      className="glass fixed inset-x-4 z-40 flex items-center justify-around gap-1 rounded-[28px] p-1.5"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === "/"} className="flex flex-1 items-center justify-center">
          {({ isActive }) => (
            <span
              className={clsx(
                "flex flex-col items-center gap-0.5 rounded-[20px] px-4 py-1.5 text-[11px] font-medium transition-colors duration-200",
                isActive ? "bg-white/10 text-text" : "text-text-muted"
              )}
            >
              <Icon size={22} weight={isActive ? "fill" : "regular"} className={isActive ? "text-accent" : undefined} />
              {label}
            </span>
          )}
        </NavLink>
      ))}

      <NavLink to="/profile" className="flex flex-1 items-center justify-center">
        {({ isActive }) => (
          <span
            className={clsx(
              "flex flex-col items-center gap-0.5 rounded-[20px] px-4 py-1.5 text-[11px] font-medium transition-colors duration-200",
              isActive ? "bg-white/10 text-text" : "text-text-muted"
            )}
          >
            <span
              className={clsx(
                "rounded-full transition-shadow",
                isActive && "shadow-[0_0_0_2px_var(--color-accent)]"
              )}
            >
              <Avatar name={user?.displayName ?? "?"} imageUrl={user?.avatarUrl} size={22} />
            </span>
            Profile
          </span>
        )}
      </NavLink>
    </nav>
  );
}
