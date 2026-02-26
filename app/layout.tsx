import type { Metadata, Viewport } from "next";
import { Bai_Jamjuree } from "next/font/google";
import "./globals.css";

import "@mantine/core/styles.layer.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/notifications/styles.css";
import "mantine-datatable/styles.layer.css";
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { theme } from "./theme";

import DateProvider from "@/components/provider/date-provider";
import { SessionProvider } from "@/components/provider/session-provider";

const baiJamjuree = Bai_Jamjuree({
  subsets: ["latin", "thai"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
    template: "%s | ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
  },
  description:
    "สังฆทานออนไลน์ ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน จำหน่ายชุดสังฆทานคุณภาพ ถูกต้องตามหลักพระพุทธศาสนา พร้อมจัดส่งทั่วประเทศ",
  keywords: [
    "สังฆทาน",
    "สังฆทานออนไลน์",
    "ชุดสังฆทาน",
    "ทำบุญออนไลน์",
    "ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
  ],
  authors: [{ name: "ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน" }],
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
    title: "ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
    description:
      "สังฆทานออนไลน์ จำหน่ายชุดสังฆทานคุณภาพ ถูกต้องตามหลักพระพุทธศาสนา พร้อมจัดส่งทั่วประเทศ",
    images: [
      {
        url: "/img/banner.png",
        width: 1200,
        height: 630,
        alt: "ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
    description: "สังฆทานออนไลน์ จำหน่ายชุดสังฆทานคุณภาพ พร้อมจัดส่งทั่วประเทศ",
    images: ["/img/banner.png"],
  },
  metadataBase: new URL(process.env.AUTH_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={baiJamjuree.className} {...mantineHtmlProps}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <ColorSchemeScript />
      </head>
      <body>
        <SessionProvider>
          <MantineProvider theme={theme}>
            <ModalsProvider>
              <DateProvider>
                <Notifications />
                {children}
              </DateProvider>
            </ModalsProvider>
          </MantineProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
