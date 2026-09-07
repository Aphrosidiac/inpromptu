// Leaflet divIcon/tooltip content is raw innerHTML, not JSX -- interpolating user-controlled
// text (display names, car names) into it without escaping is a stored-XSS vector.
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
