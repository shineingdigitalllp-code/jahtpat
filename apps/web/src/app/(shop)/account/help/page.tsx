import { ChevronDown, Mail, Package, Phone } from "lucide-react";
import type { Metadata } from "next";
import { AccountMenuItem } from "@/components/features/account/AccountMenuItem";
import { TitleHeader } from "@/components/layout/TitleHeader";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/constants";

export const metadata: Metadata = { title: "Help & Support" };

const FAQS = [
  {
    q: "How fast is delivery?",
    a: "Orders reach you in minutes. You can see your live order status in My Orders.",
  },
  {
    q: "Is there a delivery fee?",
    a: "Delivery is free on orders of ₹199 and above. A small fee of ₹20 applies to smaller orders.",
  },
  {
    q: "Which payment methods are accepted?",
    a: "UPI, credit and debit cards, net banking, wallets and Cash on Delivery. Online payments are processed securely by Razorpay.",
  },
  {
    q: "How do I use a coupon?",
    a: "Tap Apply Coupon on the cart or checkout page and pick an offer or enter a code. The discount shows in your bill before you pay.",
  },
  {
    q: "What if I receive a damaged or expired item?",
    a: "Request a replacement within 48 hours of delivery by contacting support with your order ID.",
  },
  {
    q: "How do I change my delivery address?",
    a: "Go to Account, then Saved Addresses, to add, edit or set a default address. You can also change it on the checkout page.",
  },
];

export default function HelpPage() {
  const contacts = [
    SUPPORT_PHONE ? {
      href: `tel:${SUPPORT_PHONE}`,
      icon: Phone,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
      title: "Call us",
      subtitle: SUPPORT_PHONE,
    } : null,
    SUPPORT_EMAIL ? {
      href: `mailto:${SUPPORT_EMAIL}`,
      icon: Mail,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-700",
      title: "Email us",
      subtitle: SUPPORT_EMAIL,
    } : null,
  ].filter((item) => item !== null);

  return (
    <>
      <TitleHeader title="Help & Support" back />
      <div className="space-y-5 px-4">
        <section>
          <h2 className="px-1 pb-2 text-[11px] font-black tracking-wider text-muted uppercase">Get help</h2>
          <ul className="divide-y overflow-hidden rounded-3xl bg-surface shadow-card">
            <AccountMenuItem
              href="/orders"
              icon={Package}
              iconBg="bg-primary-soft"
              iconColor="text-ink"
              title="Help with an order"
              subtitle="Check status of recent orders"
            />
            {contacts.map((item) => (
              <AccountMenuItem key={item.title} {...item} />
            ))}
          </ul>
        </section>

        <section>
          <h2 className="px-1 pb-2 text-[11px] font-black tracking-wider text-muted uppercase">Frequently asked questions</h2>
          <div className="divide-y overflow-hidden rounded-3xl bg-surface shadow-card">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                  <span className="flex-1">{q}</span>
                  <ChevronDown aria-hidden className="size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="px-4 pb-4 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
