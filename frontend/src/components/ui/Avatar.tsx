import { resolveImageUrl } from "../../lib/api";

const PALETTE = ["#c6ff4d", "#4dd8ff", "#ff9a4d", "#ff4dc4", "#8b5cf6", "#4dff9a"];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({ name, size = 36, imageUrl }: { name: string; size?: number; imageUrl?: string | null }) {
  const resolved = resolveImageUrl(imageUrl);
  if (resolved) {
    return (
      <img
        src={resolved}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const color = colorFor(name);
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{ width: size, height: size, background: `${color}26`, color, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}
