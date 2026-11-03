import type { Metadata } from "next";
import { Noto_Sans_SC, Noto_Serif_SC, Cormorant_Garamond } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-serif",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "滇红 · 金芽醇香 | 凤庆滇红",
    template: "%s | 凤庆滇红",
  },
  description:
    "高端精品滇红茶。云南凤庆高山产地，金芽、蜜香与醇厚汤感，传统工夫红茶工艺。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSans.variable} ${notoSerif.variable} ${cormorant.variable}`}
    >
      <body className="min-h-screen bg-[#1A120B] text-[#F5EFE6] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
