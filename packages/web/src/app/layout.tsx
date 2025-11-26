import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reconcilify - Reconciliation as a Service",
  description: "Automate financial and event data reconciliation across fragmented SaaS and e-commerce ecosystems",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
