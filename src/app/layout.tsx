
import type { Metadata } from "next";
import { Noto_Sans_Lao } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { FirebaseClientProvider } from "@/firebase/client-provider";

const fontSans = Noto_Sans_Lao({
  subsets: ["lao", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
    <html lang="lo" className={fontSans.className}>
      <body
        className={cn(
          "min-h-screen bg-background antialiased"
        )}
      >
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
      </body>
    </html>
  );
}
