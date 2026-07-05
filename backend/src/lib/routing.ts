export type LatLng = { lat: number; lng: number };

export class RoutingError extends Error {}

// Real, road-following routes via OpenRouteService's driving-car profile -- replaces the
// earlier straight-line/waypoint approximation. ORS's directions API takes/returns
// coordinates as [lng, lat] pairs (GeoJSON order), which we convert to/from our {lat,lng}
// convention at the boundary here so the rest of the codebase never has to think about it.
export async function getDrivingRoute(apiKey: string, points: LatLng[]): Promise<{ waypoints: LatLng[]; distanceMeters: number }> {
  const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: points.map((p) => [p.lng, p.lat]),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new RoutingError(`Routing request failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    features?: {
      geometry: { coordinates: [number, number][] };
      properties: { summary: { distance: number } };
    }[];
  };

  const feature = data.features?.[0];
  if (!feature) throw new RoutingError("Routing response had no route");

  return {
    waypoints: feature.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    distanceMeters: Math.round(feature.properties.summary.distance),
  };
}
