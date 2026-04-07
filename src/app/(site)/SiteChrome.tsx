"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import AuthProvider from "../context/AuthContext";
import ToasterContext from "../context/ToastContext";

import "../../css/animate.css";
import "../../css/style.css";

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
    </>
  );
}
