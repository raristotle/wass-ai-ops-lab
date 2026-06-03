import type { Metadata } from "next";
import { Inter, Titillium_Web, Source_Sans_3 } from "next/font/google";
import "./globals.css";

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
  title: "WASS AI Ops Lab",
  description: "AI operations monitoring dashboard for LLM workloads",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${titilliumWeb.variable} ${sourceSans.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
