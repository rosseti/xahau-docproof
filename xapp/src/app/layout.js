"use client";

import localFont from "next/font/local";
import { AppProvider, AppContext } from "@/context/AppContext";
import React from "react";
import { GoogleAnalytics } from '@next/third-parties/google';

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
  const hideHeaderRoutesFiltered = hideHeaderRoutes
    .filter(url => pathname.startsWith(url)).length > 0
    ||
    pathname === '/';

  return (
      <AppProvider>
        <html lang="en">
          <head>
            <title>{process.env.NEXT_PUBLIC_APP_NAME || "Xahau DocProof"}</title>

            <meta name="description" content="Transform document workflows with cryptographically sealed, instantly verifiable digital signatures powered by cutting-edge blockchain technology." />
            <meta name="keywords" content="Document Authentication, Proof of Existence, Document Integrity, Blockchain, Digital Signature, Xahau Ledger, XRPL, Cryptography, Document Verification, Document Security" />
            <meta name="author" content="Xahau DocProof" />

            <meta property="og:title" content="Xahau DocProof" />
            <meta property="og:description" content="Transform document workflows with cryptographically sealed, instantly verifiable digital signatures powered by cutting-edge blockchain technology." />
            <meta property="og:type" content="website" />
            <meta property="og:image" content={`${process.env.NEXT_PUBLIC_APP_URL}social.jpg`} />

            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:title" content="Xahau DocProof" />
            <meta property="twitter:description" content="Transform document workflows with cryptographically sealed, instantly verifiable digital signatures powered by cutting-edge blockchain technology." />
            <meta property="twitter:image" content={`${process.env.NEXT_PUBLIC_APP_URL}social.jpg`} />
            <meta property="twitter:site" content="@XahauDocproof" />

            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
            <link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet" />
            {process.env.NEXT_PUBLIC_GA_ID && (<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />)}
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
