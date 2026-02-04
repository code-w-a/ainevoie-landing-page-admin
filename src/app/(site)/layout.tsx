"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { inter } from "@/lib/fonts";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import React from "react";
import "../../css/animate.css";
import "../../css/style.css";
import AuthProvider from "../context/AuthContext";
import ToasterContext from "../context/ToastContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextTopLoader
          color="#d35400"
          crawlSpeed={300}
          showSpinner={false}
          shadow="none"
        />

        <ThemeProvider
          enableSystem={false}
          attribute="class"
          defaultTheme="light"
        >
          <div className="isolate">
            <AuthProvider>
              <Header />
              <div className="isolate">{children}</div>
              <Footer />
            </AuthProvider>
          </div>

          <ToasterContext />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
