import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiMo Debate Arena | Multi-Agent AI Debate Platform",
  description: "Watch AI agents debate from multiple perspectives - Optimist, Skeptic, Analyst, and Contrarian - powered by MiMo API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
