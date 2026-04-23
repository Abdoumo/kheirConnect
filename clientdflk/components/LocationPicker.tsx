import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Save, MapPin, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Fix for leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onSave: (lat: number, lng: number) => Promise<void>;
  loading?: boolean;
}

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({
  initialLat = 36.737,
  initialLng = 3.086,
  onSave,
  loading = false,
}: LocationPickerProps) {
  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLng);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapCenter: [number, number] = [latitude, longitude];

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      console.log("LocationPicker: Calling onSave with", { latitude, longitude });
      await onSave(latitude, longitude);
      console.log("LocationPicker: Save successful");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to save location";
      console.error("LocationPicker: Save failed:", error);
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error saving location</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Click on the map to select location</label>
        <div className="rounded-lg overflow-hidden border border-border shadow-sm h-96">
          <MapContainer
            center={mapCenter}
            zoom={6}
            className="w-full h-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            <Marker position={[latitude, longitude]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Selected Location</p>
                  <p>{latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Latitude</label>
          <input
            type="number"
            step="0.0001"
            value={latitude.toFixed(4)}
            onChange={(e) => setLatitude(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            placeholder="Latitude"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Longitude</label>
          <input
            type="number"
            step="0.0001"
            value={longitude.toFixed(4)}
            onChange={(e) => setLongitude(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            placeholder="Longitude"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving || loading}
        className={cn(
          "w-full px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2",
          "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Location
          </>
        )}
      </button>
    </div>
  );
}
