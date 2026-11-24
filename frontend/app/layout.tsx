import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/dm-sans";
import "./globals.css";
export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.ico?v=pageturner-books", sizes: "any" },
      { url: "/favicon.svg?v=pageturner-books", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png?v=pageturner-books",
  },
  title: {
    default: "PageTurner — A home for your books",
    template: "%s · PageTurner",
  },
  description:
    "Discover your next favorite book. Build a personal library, keep track of your reading, and get lost in a good story.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f2e9",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div className="atmosphere" aria-hidden="true" />
        <div className="app-window">{children}</div>
      </body>
    </html>
  );
}
