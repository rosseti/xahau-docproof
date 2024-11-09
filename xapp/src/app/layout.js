"use client";

import localFont from "next/font/local";
import { AppProvider, AppContext } from "@/context/AppContext";
import React from "react";

import { useRouter, usePathname } from 'next/navigation';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import setupAxiosInterceptors from '@/utils/axiosConfig';

import "./globals.css";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({ children }) {
  const pathname = usePathname();
  setupAxiosInterceptors();
  const hideHeaderRoutes = ['/login', '/sign'];
  const hideHeaderRoutesFiltered = hideHeaderRoutes.filter(url => pathname.startsWith(url)).length > 0;
  return (
      <AppProvider>
        <html lang="en">
          <head>
            <title>{process.env.NEXT_PUBLIC_APP_NAME || "EVM | XSign"}</title>
          </head>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <ToastContainer />

            {!hideHeaderRoutesFiltered && <Header />}

            {children}

            {!hideHeaderRoutesFiltered && <Footer />}
          </body>
        </html>
      </AppProvider>
  );
}
