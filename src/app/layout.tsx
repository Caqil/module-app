import { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Modular App",
  description: "A modular web application built with Next.js 15",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
