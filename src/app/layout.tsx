import { FirebaseClientProvider } from "@/firebase";
import "./globals.css";

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
    <html lang="lo">
      <body>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
