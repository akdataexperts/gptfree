import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPTfree",
  description: "GPTfree",
  icons: {
    icon: "/favicon.jpeg",
    apple: "/favicon.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
