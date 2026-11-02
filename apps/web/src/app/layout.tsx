import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { StoreClosedBanner } from "@/components/layout/StoreClosedBanner";
import "@/styles/globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz"] });

export const metadata: Metadata = {
  title: { default: "Jhatpat — Groceries, Delivered in Minutes", template: "%s · Jhatpat" },
  description: "Fresh groceries delivered in minutes in Kota.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f2f2f7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" className={`${jakarta.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="bg-canvas font-sans text-ink antialiased" suppressHydrationWarning>
        <div className="mx-auto min-h-dvh max-w-app bg-canvas sm:shadow-card">
          <Providers>
            <StoreClosedBanner />
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
