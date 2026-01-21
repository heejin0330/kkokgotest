import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  description:
    "AI기반 진로테스트로 나에게 맞는 특성화고, 마이스터고를 찾아보세요",
  openGraph: {
    title: "꼭고 - 1분만에 내적성에 맞는 특성화고 찾기",
    description:
      "AI기반 진로테스트로 나에게 맞는 특성화고, 마이스터고를 찾아보세요",
    url: "https://kkokgotest.vercel.app",
    siteName: "꼭고",
    images: [
      {
        url: "https://kkokgotest.vercel.app/og-image-2.png",
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
    description:
      "AI기반 진로테스트로 나에게 맞는 특성화고, 마이스터고를 찾아보세요",
    images: ["https://kkokgotest.vercel.app/og-image-2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TNF48HDH');`,
          }}
        />
        {/* End Google Tag Manager */}
        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  // 사용자 식별을 위한 설정
                  anonymize_ip: false,
                  allow_google_signals: true,
                  allow_ad_personalization_signals: true
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TNF48HDH"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {children}
      </body>
    </html>
  );
}
