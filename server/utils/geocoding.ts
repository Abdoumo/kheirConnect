/**
 * Geocode a location string to latitude and longitude using OpenStreetMap Nominatim API
 */
export async function geocodeLocation(
  locationString: string
): Promise<{ latitude: number; longitude: number } | null> {
  if (!locationString || locationString.trim().length === 0) {
    return null;
  }

  try {
    const encodedLocation = encodeURIComponent(locationString);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "InstitutionDonationApp/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error(`Geocoding API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };
    }

    console.warn(`No geocoding results found for: ${locationString}`);
    return null;
  } catch (error) {
    console.error(`Geocoding error for "${locationString}":`, error);
    return null;
  }
}
