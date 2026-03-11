import { FirebaseClientProvider } from "@/firebase";
import "./globals.css";
import { Noto_Sans_Lao } from 'next/font/google';

const notoSanLao = Noto_Sans_Lao({
  subsets: ['lao'],
  weight: ['400', '700'],
  variable: '--font-noto-sans-lao',
});

export const metadata = {
  title: "Tour Cost Calculator",
  description: "Calculate and manage tour costs easily",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lo" className={notoSanLao.variable}>
      <body className="font-sans antialiased">
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
