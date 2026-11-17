import type { Metadata } from "next";
import "./panel.css";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

export default function PanelRoot({ children }: { children: React.ReactNode }) {
  return children;
}
