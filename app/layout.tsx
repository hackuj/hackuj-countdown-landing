import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "HACKUJ — Spustenie Sezóny '26",
  description: "HACKUJ kybernetická súťažná platforma - odpočet do spustenia sezóny 2026.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sk" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Schibsted+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
