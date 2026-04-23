import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin } from "lucide-react";

// Fix for leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons for different statuses
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


export default function InstitutionsMap() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.0339, 1.6596]); // Algeria center

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const response = await fetch("/api/institutions/map/locations");
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data);

        // Calculate map center based on institutions
        if (data.length > 0) {
          const avgLat = data.reduce((sum: number, inst: Institution) => sum + inst.latitude, 0) / data.length;
          const avgLng = data.reduce((sum: number, inst: Institution) => sum + inst.longitude, 0) / data.length;
          setMapCenter([avgLat, avgLng]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch institutions map:", err);
    } finally {
      setLoading(false);
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
        <MapPin className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
        <p className="text-muted-foreground">No institutions to display yet</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border shadow-sm">
      <MapContainer
        center={mapCenter}
        zoom={6}
        className="w-full h-96"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {institutions.map((institution) => {
          return (
            <Marker
              key={institution._id}
              position={[institution.latitude, institution.longitude]}
              icon={getMarkerIcon(institution.markerStatus)}
            >
              <Popup>
                <div className="w-48">
                  <h3 className="font-semibold text-sm mb-1">{institution.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{institution.location}</p>
                  {institution.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{institution.description}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
