import type { Metadata } from "next";
import "./globals.css";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { AppleToastProvider } from "@/components/ui/AppleToast";

export const metadata: Metadata = {
  title: "Apotek Kerso Waras - Sistem Manajemen Farmasi Terpadu (Kedung, Jepara)",
  description:
    "Sistem Informasi Manajemen Apotek Kerso Waras, Kedung, Jepara. Terintegrasi Kemenkes SATUSEHAT, SIPNAP, BPOM, dan FEFO Inventory berstandar Apple HIG.",
  icons: {
    icon: "/icon.png",
    apple: "/logo-app-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50/50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 flex flex-col pb-16 lg:pb-0">
        <AppleToastProvider>
          <RouteGuard>{children}</RouteGuard>
        </AppleToastProvider>
      </body>
    </html>
  );
}
