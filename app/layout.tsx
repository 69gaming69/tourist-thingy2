import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./components/navbar";
import Providers from "./components/Providers";

export const metadata: Metadata = {
  title: "Phuket Tourist App",
  description: "Explore places in Phuket",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
