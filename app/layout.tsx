import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PDF to Structured Data (CSV/Excel)',
  description: 'Extract tables and key data from PDF files instantly. Download as CSV or Excel. No signup needed.',
  keywords: 'PDF to CSV, PDF to Excel, PDF converter, table extraction, data extraction',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-R6RQGVVBRF"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-R6RQGVVBRF');
            `,
          }}
        />
      </body>
    </html>
  );
}