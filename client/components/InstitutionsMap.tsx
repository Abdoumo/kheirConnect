import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const markerIcons: Record<string, L.Icon> = {
  blue: L.icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  red: L.icon({
    iconUrl: "https://www.uv.es//recursos/fatwirepub/ccurl/702/428/red-marker.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  green: L.icon({
    iconUrl: "https://freesvg.org/img/green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  orange: L.icon({
    iconUrl: "https://cdn.pixabay.com/photo/2023/05/31/01/10/location-pin-8030280_640.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
};

function getMarkerIcon(status?: string): L.Icon {
  return markerIcons[status || "blue"] || markerIcons.blue;
}

interface Institution {
  _id: string;
  name: string;
  location: string;
  description: string;
  latitude: number;
  longitude: number;
  markerStatus?: "blue" | "red" | "green" | "orange";
}

interface WeeklyNeed {
  _id: string;
  title: string;
  description: string;
  urgency: "urgent" | "quotidien";
  fullyDonated: boolean;
  createdAt: string;
}

function getMarkerStatusFromNeeds(needs: WeeklyNeed[]): "green" | "orange" | "red" {
  if (!needs || needs.length === 0) {
    return "green";
  }

  const unfulfilledNeeds = needs.filter((need) => !need.fullyDonated);

  if (unfulfilledNeeds.length === 0) {
    return "green";
  }

  const hasUrgent = unfulfilledNeeds.some((need) => need.urgency === "urgent");
  if (hasUrgent) {
    return "red";
  }

  return "orange";
}

export default function InstitutionsMap({ token }: { token: string }) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.0339, 1.6596]); // Algeria center
  const [weeklyNeeds, setWeeklyNeeds] = useState<Record<string, WeeklyNeed[]>>({});
  const [needsLoading, setNeedsLoading] = useState<Record<string, boolean>>({});
  const [markerStatuses, setMarkerStatuses] = useState<Record<string, "green" | "orange" | "red">>({})

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const response = await fetch("/api/institutions/map/locations");
      if (response.ok) {
        const data: Institution[] = await response.json();
        setInstitutions(data);

        if (data.length > 0) {
          const avgLat = data.reduce((sum, inst) => sum + inst.latitude, 0) / data.length;
          const avgLng = data.reduce((sum, inst) => sum + inst.longitude, 0) / data.length;
          setMapCenter([avgLat, avgLng]);

          // Fetch needs for all institutions to determine initial marker colors
          data.forEach((inst) => {
            fetchWeeklyNeeds(inst._id);
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch institutions map:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyNeeds = async (institutionId: string) => {
    if (!token) {
      console.warn("No token available to fetch weekly needs");
      return;
    }

    setNeedsLoading((prev) => ({ ...prev, [institutionId]: true }));
    try {
      const response = await fetch(`/api/institutions/${institutionId}/weekly-needs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data: WeeklyNeed[] = await response.json();
        setWeeklyNeeds((prev) => ({ ...prev, [institutionId]: data }));
        const status = getMarkerStatusFromNeeds(data);
        setMarkerStatuses((prev) => ({ ...prev, [institutionId]: status }));
      } else {
        console.error(`Failed to fetch weekly needs: ${response.status}`);
      }
    } catch (err) {
      console.error(`Failed to fetch weekly needs for ${institutionId}:`, err);
    } finally {
      setNeedsLoading((prev) => ({ ...prev, [institutionId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-secondary/5 rounded-lg border border-border">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (institutions.length === 0) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-secondary/5 rounded-lg border border-border">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-lg font-semibold text-foreground mb-2">No institutions to display yet</p>
        <p className="text-muted-foreground text-center max-w-xs">Check back soon as more charitable institutions register and get approved</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border shadow-sm">
      <MapContainer center={mapCenter} zoom={6} className="w-full h-96" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {institutions.map((institution) => (
          <Marker
            key={institution._id}
            position={[institution.latitude, institution.longitude]}
            icon={getMarkerIcon(markerStatuses[institution._id] || "green")}
            eventHandlers={{
              click: () => {
                if (!weeklyNeeds[institution._id]) {
                  fetchWeeklyNeeds(institution._id);
                }
              },
            }}
          >
            <Popup>
              <div className="w-56 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm">{institution.name}</h3>
                  <p className="text-xs text-gray-600">{institution.location}</p>
                </div>

                {/* Hover popup content - shows "i want on marker" with priority */}
                <div className="space-y-2">
                  {needsLoading[institution._id] ? (
                    <div className="flex justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  ) : weeklyNeeds[institution._id] && weeklyNeeds[institution._id].length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-2">here there is  </p>
                      {/* Get the highest priority need */}
                      {(() => {
                        const needs = weeklyNeeds[institution._id];
                        const hasUrgent = needs.some((n) => n.urgency === "urgent");
                        const hasQuotidien = needs.some((n) => n.urgency === "quotidien");

                        let priorityColor = "green"; // default
                        if (hasUrgent) {
                          priorityColor = "red";
                        } else if (hasQuotidien) {
                          priorityColor = "orange";
                        }

                        // Merge all needs into a single display
                        const mergedTitles = needs.map((n) => n.title).join(", ");
                        const mergedDescriptions = needs.map((n) => n.description).join("; ");

                        return (
                          <div
                            className={`p-2 rounded-md space-y-1 ${
                              priorityColor === "red"
                                ? "bg-red-100/30"
                                : priorityColor === "orange"
                                  ? "bg-orange-100/30"
                                  : "bg-green-100/30"
                            }`}
                          >
                            <p className="text-xs font-medium">{mergedTitles}</p>
                            {mergedDescriptions && (
                              <p className="text-[10px] text-muted-foreground line-clamp-2">
                                {mergedDescriptions}
                              </p>
                            )}
                            <div className="flex items-center gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  priorityColor === "red"
                                    ? "bg-red-500"
                                    : priorityColor === "orange"
                                      ? "bg-orange-500"
                                      : "bg-green-500"
                                }`}
                              />
                              <span className="text-[10px] font-semibold">
                                {priorityColor === "red"
                                  ? "Urgent"
                                  : priorityColor === "orange"
                                    ? "Regular"
                                    : "No needs"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="py-2">
                      <p className="text-xs font-medium text-foreground mb-2">i want on marker</p>
                      <div className="p-2 rounded-md bg-green-100/30">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-[10px] font-semibold">No needs</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
