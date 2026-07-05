import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/i18n/server";
import { messages } from "@/lib/i18n/messages";
import { I18nProvider } from "@/lib/i18n/provider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

// Display serif — la voix éditoriale de la nouvelle DA (titres, chiffres héros)
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "BidEdge — The edge, on every bid.",
  description:
    "BidEdge scans the categories you hunt, sets the real market rate and whispers you the right bid. You place it. Never any autobidding.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable} font-sans antialiased`}>
        <I18nProvider locale={locale} messages={messages[locale]}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
