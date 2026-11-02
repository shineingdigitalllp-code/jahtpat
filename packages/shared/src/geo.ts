import { z } from 'zod';

export const reverseGeocodeSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
export type ReverseGeocodeInput = z.infer<typeof reverseGeocodeSchema>;

export type GeoAddress = {
  line2: string;
  city: string;
  state: string;
  pincode: string;
};
