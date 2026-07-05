const PALETTE = ["#c6ff4d", "#4dd8ff", "#ff9a4d", "#ff4dc4", "#8b5cf6", "#4dff9a"];

export function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initialFor(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}
