const EARTH_RADIUS_M = 6371000;

export type LatLng = { lat: number; lng: number };

// Destination-point spherical formula: walks `distanceMeters` from (lat, lng) along `bearingDeg`.
function destinationPoint(lat: number, lng: number, bearingDeg: number, distanceMeters: number): LatLng {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const angularDistance = distanceMeters / EARTH_RADIUS_M;
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lng1 = toRad(lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) + Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return { lat: toDeg(lat2), lng: toDeg(lng2) };
}

// Generates a straight-line-ish route: picks a random bearing from the origin, walks
// `distanceMeters` along it to get the end point, and adds a couple of intermediate
// waypoints jittered slightly off the straight line so it isn't a perfectly straight arrow.
// Deliberately NOT road-following (no routing engine) per the product requirements.
export function generateRandomRoute(originLat: number, originLng: number, distanceMeters: number) {
  const bearingDeg = Math.random() * 360;
  const end = destinationPoint(originLat, originLng, bearingDeg, distanceMeters);

  const waypoints: LatLng[] = [{ lat: originLat, lng: originLng }];

  const segments = distanceMeters > 3000 ? 2 : 1;
  for (let i = 1; i <= segments; i++) {
    const fraction = i / (segments + 1);
    const alongLat = originLat + (end.lat - originLat) * fraction;
    const alongLng = originLng + (end.lng - originLng) * fraction;
    const jitterBearing = bearingDeg + (Math.random() > 0.5 ? 90 : -90);
    const jitterMeters = Math.min(distanceMeters * 0.05, 150);
    const jittered = destinationPoint(alongLat, alongLng, jitterBearing, Math.random() * jitterMeters);
    waypoints.push(jittered);
  }

  waypoints.push(end);

  return { start: { lat: originLat, lng: originLng }, end, waypoints };
}
