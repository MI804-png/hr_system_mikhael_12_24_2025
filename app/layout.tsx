import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { PermissionProvider } from "@/context/PermissionContext";
import ProtectedLayout from "@/components/ProtectedLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HR Management System",
  description: "Professional HR management and employee engagement platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <DataProvider>
            <NotificationProvider>
              <PermissionProvider>
                <ProtectedLayout>
                  <div className="flex h-screen bg-gray-50">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Header />
                      <main className="flex-1 overflow-auto">
                        {children}
                      </main>
                    </div>
                  </div>
                </ProtectedLayout>
              </PermissionProvider>
            </NotificationProvider>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
