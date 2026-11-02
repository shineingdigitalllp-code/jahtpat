import { useState } from "react";
import type { GeoAddress } from "@jhatpat/shared";
import { api } from "@/lib/api";

export type DetectedLocation = GeoAddress & { lat: number; lng: number };

const POSITION_ERRORS: Record<number, string> = {
  1: "Location access is blocked. Allow it in your browser settings and try again.",
  2: "Could not find your location. Check that GPS or Wi-Fi is on.",
  3: "Finding your location took too long. Please try again.",
};

const getPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!window.isSecureContext || !("geolocation" in navigator)) {
      reject(new Error("Location is not available in this browser. Please enter your address manually."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (error) => reject(new Error(POSITION_ERRORS[error.code] ?? error.message)), {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 60_000,
    });
  });

export function useCurrentLocation() {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = async (): Promise<DetectedLocation | null> => {
    setLocating(true);
    setError(null);
    try {
      const { coords } = await getPosition();
      const lat = Number(coords.latitude.toFixed(6));
      const lng = Number(coords.longitude.toFixed(6));
      const address = await api<GeoAddress>(`/geo/reverse?lat=${lat}&lng=${lng}`);
      return { ...address, lat, lng };
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not detect your location.");
      return null;
    } finally {
      setLocating(false);
    }
  };

  return { locate, locating, error };
}
