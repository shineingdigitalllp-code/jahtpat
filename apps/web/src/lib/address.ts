import { Briefcase, Home, MapPin, type LucideIcon } from "lucide-react";
import type { Address } from "@jhatpat/shared";

const ADDRESS_ICONS: Record<string, LucideIcon> = { Home, Work: Briefcase };

export const addressIcon = (label: string) => ADDRESS_ICONS[label] ?? MapPin;

export const formatAddress = (address: Pick<Address, "line1" | "line2" | "city" | "state" | "pincode">) =>
  `${[address.line1, address.line2, address.city, address.state].filter(Boolean).join(", ")} - ${address.pincode}`;
