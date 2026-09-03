import "./globals.css";

export const metadata = {
  title: "PricePilot AI",
  description: "Dynamic Pricing Optimization & Revenue Intelligence System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
