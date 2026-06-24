import type { ReactNode } from "react";
import "@/app/globals.css";

export const metadata = {
  title: "Pashion",
  description: "Pashion platform for independent brands",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
