import type { Metadata } from "next";
import { Noto_Serif_Lao } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const fontSans = Noto_Serif_Lao({
  subsets: ["lao"],
  variable: "--font-sans",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "POS ລາວ",
  description: "ລະບົບຂາຍອາໄຫຼ່",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lo">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
