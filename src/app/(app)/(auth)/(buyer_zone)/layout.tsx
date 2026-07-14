import Layout from "./_layout";
import { ReactNode } from "react";

type BuyerZoneLayoutProps = {
  children: ReactNode;
};

export default function BuyerZoneAppLayout({ children }: BuyerZoneLayoutProps) {
  return <Layout>{children}</Layout>;
}
