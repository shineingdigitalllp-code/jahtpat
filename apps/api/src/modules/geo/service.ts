import type { GeoAddress, ReverseGeocodeInput } from '@jhatpat/shared';
import { AppError } from '@/utils/app-error';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

type NominatimAddress = Partial<
  Record<
    'house_number' | 'road' | 'neighbourhood' | 'suburb' | 'quarter' | 'city_district' | 'city' | 'town' | 'village' | 'county' | 'state_district' | 'state' | 'postcode',
    string
  >
>;

export async function reverseGeocode({ lat, lng }: ReverseGeocodeInput): Promise<GeoAddress> {
  const url = `${NOMINATIM_URL}?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Jhatpat grocery delivery app', 'Accept-Language': 'en-IN,en' },
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res?.ok) throw new AppError(502, 'GEOCODE_FAILED', 'Could not detect your address. Please enter it manually.');

  const { address } = (await res.json()) as { address?: NominatimAddress };
  if (!address) throw new AppError(404, 'GEOCODE_NOT_FOUND', 'No address found for this location');

  const area = [address.house_number, address.road, address.neighbourhood ?? address.quarter, address.suburb ?? address.city_district];
  return {
    line2: area.filter(Boolean).join(', '),
    city: address.city ?? address.town ?? address.village ?? address.state_district ?? address.county ?? '',
    state: address.state ?? '',
    pincode: address.postcode?.replace(/\s/g, '') ?? '',
  };
}
