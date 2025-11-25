import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRD Drift Detector",
  description: "Real-time tracking of PRD-to-delivery alignment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
