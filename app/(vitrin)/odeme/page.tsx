import type { Metadata } from "next";
import { OdemeForm } from "./OdemeForm";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false } };

export default function OdemeSayfasi() {
  return (
    <div className="wrap">
      <OdemeForm />
    </div>
  );
}
