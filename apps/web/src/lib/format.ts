const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrPaise = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
const TIME_ZONE = "Asia/Kolkata";
const time = new Intl.DateTimeFormat("en-IN", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit", hour12: true });
const date = new Intl.DateTimeFormat("en-IN", { timeZone: TIME_ZONE, day: "numeric", month: "short", year: "numeric" });
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

export const formatINR = (paise: number) => (paise % 100 === 0 ? inr : inrPaise).format(paise / 100);

export const discountPercent = (pricePaise: number, mrpPaise: number) =>
  mrpPaise > pricePaise ? Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100) : 0;

export const formatTime = (iso: string) => time.format(new Date(iso)).toUpperCase();

export const formatOrderDate = (iso: string) => {
  const value = new Date(iso);
  const day = dayKey.format(value) === dayKey.format(new Date()) ? "Today" : date.format(value);
  return `${day}, ${formatTime(iso)}`;
};

export const formatMobile = (mobile: string) => `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
