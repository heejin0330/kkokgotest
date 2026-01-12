import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "꼭고 - 1분만에 내적성에 맞는 특성화고 찾기",
  description: "AI기반 진로테스트로 나에게 맞는 특성화고, 마이스터고를 찾아보세요",
  openGraph: {
    title: "꼭고 - 1분만에 내적성에 맞는 특성화고 찾기",
    description: "AI기반 진로테스트로 나에게 맞는 특성화고, 마이스터고를 찾아보세요",
    url: "https://kkokgo-landing.vercel.app",
    siteName: "꼭고",
    images: [
      {
        url: "https://kkokgo-landing.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "꼭고 - AI 기반 특성화고 매칭 플랫폼",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "꼭고 - 1분만에 내적성에 맞는 특성화고 찾기",
    description: "AI기반 진로테스트로 나에게 맞는 특성화고, 마이스터고를 찾아보세요",
    images: ["https://kkokgo-landing.vercel.app/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
