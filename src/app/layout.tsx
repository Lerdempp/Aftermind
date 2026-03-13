import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

const interVariable = localFont({
  src: [
    {
      path: "../../fonts/Inter-4.1/InterVariable.ttf",
      style: "normal",
    },
    {
      path: "../../fonts/Inter-4.1/InterVariable-Italic.ttf",
      style: "italic",
    },
  ],
  variable: "--font-inter-variable",
});

const interDisplay = localFont({
  src: [
    {
      path: "../../fonts/inter-display/InterVariable.ttf",
      style: "normal",
    },
    {
      path: "../../fonts/inter-display/InterVariable-Italic.ttf",
      style: "italic",
    },
  ],
  variable: "--font-inter-display",
});

const geistMono = localFont({
  src: [
    {
      path: "../../fonts/Geist_Mono,Inter/Geist_Mono/GeistMono-VariableFont_wght.ttf",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${interVariable.variable} ${interDisplay.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}

