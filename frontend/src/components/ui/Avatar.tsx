import { resolveImageUrl } from "../../lib/api";
import { colorFor, initialFor } from "../../lib/avatarColor";

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

  const color = colorFor(name);
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{ width: size, height: size, background: `${color}26`, color, fontSize: size * 0.42 }}
    >
      {initialFor(name)}
    </div>
  );
}
