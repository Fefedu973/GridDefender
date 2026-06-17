import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grid Defender: AI Load Control",
  description:
    "Serious game de supervision energetique pour orchestrer les charges IA pendant un pic reseau.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
