import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "OmniDimension Web Voice Example",
  description: "A reference implementation for OmniDimension Web SDK sessions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
