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

// Real roads wind, so a straight-line distance of X typically produces a road route noticeably
// longer than X. Aiming the candidate destination at a fraction of the requested distance
// gets the resulting *road* distance (computed afterwards by the actual routing engine) into
// the right neighborhood -- it's an approximation, not exact, since we don't know the local
// road layout in advance.
const STRAIGHT_LINE_FUDGE_FACTOR = 0.75;

// Picks a random destination point roughly `targetDistanceMeters` away from the origin, to be
// handed to the real routing engine (getDrivingRoute) for an actual road route. Deliberately
// does not attempt to hit the target distance exactly -- see fudge factor note above.
export function pickRandomDestination(originLat: number, originLng: number, targetDistanceMeters: number): LatLng {
  const bearingDeg = Math.random() * 360;
  return destinationPoint(originLat, originLng, bearingDeg, targetDistanceMeters * STRAIGHT_LINE_FUDGE_FACTOR);
}
