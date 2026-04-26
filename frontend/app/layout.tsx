import type { Metadata } from "next";
import { Geist_Mono, Nunito } from "next/font/google";
import { ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Perception",
  description: "AI-driven assessment and evaluation platform",
  icons: {
    icon: "favicon.svg",
  },
};

const theme = createTheme({
  fontFamily: "var(--font-nunito), Arial, sans-serif",
  primaryColor: "blue",
  colors: {
    // Royal Blue adapted for primary shades
    blue: [
      "#eff6ff",
      "#dbeafe",
      "#bfdbfe",
      "#93c5fd",
      "#60a5fa",
      "#3b82f6", // Primary brand color
      "#2563eb",
      "#1d4ed8",
      "#1e40af",
      "#1e3a8a",
    ],
    // Teal adapted for secondary/accent
    teal: [
      "#f0fdfa",
      "#ccfbf1",
      "#99f6e4",
      "#5eead4",
      "#2dd4bf",
      "#14b8a6",
      "#0d9488", // Secondary brand color
      "#0f766e",
      "#115e59",
      "#134e4a",
    ],
  },
  defaultRadius: "md",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Header />
          <main className="grow flex flex-col">{children}</main>
          <Footer />
        </MantineProvider>
      </body>
    </html>
  );
}
