import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ToastContainer from "@/components/ToastContainer";
import Watermark from "@/components/Watermark";
import Chatbot from "@/components/Chatbot";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "n9.com | 울산 남구 중학교 커뮤니티",
  description: "울산광역시 남구 중학교 교직원 커뮤니티",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full font-sans">
        {children}
        <Watermark />
        <ToastContainer />
        <Chatbot />
      </body>
    </html>
  );
}
