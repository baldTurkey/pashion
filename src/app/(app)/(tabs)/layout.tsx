import TabLayout from "./_layout";
import { ReactNode } from "react";

type TabsLayoutProps = {
  children: ReactNode;
};

export default function TabsLayout({ children }: TabsLayoutProps) {
  return <TabLayout>{children}</TabLayout>;
}
