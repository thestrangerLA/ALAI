
import type { Metadata } from "next";
import { Mitr } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { FirebaseClientProvider } from "@/firebase/client-provider";

const fontSans = Mitr({
  subsets: ["latin", "thai", "vietnamese"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "POS ລະບົບຂາຍສິ້ນສ່ວນ",
  description: "ລະບົບຂາຍສິ້ນສ່ວນລົດຍົນ",
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
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
      </body>
    </html>
  );
}
