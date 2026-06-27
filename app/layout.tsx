import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phuket Tourist App",
  description: "Explore places in Phuket with Geoapify",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
