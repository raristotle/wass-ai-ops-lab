import type { Metadata, Viewport } from "next";
import { Inter, Titillium_Web, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./providers";
import { ServiceWorkerRegister } from "./sw-register";

const inter = Inter({ subsets: ["latin"] });

const titilliumWeb = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-titillium",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  title: "Meridian — Product Finder",
  description: "AI product recommender for electrical distributors — search, cross-reference, and quote.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Meridian", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#00AA13",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${titilliumWeb.variable} ${sourceSans.variable}`}
      >
        <PostHogProvider>{children}</PostHogProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
