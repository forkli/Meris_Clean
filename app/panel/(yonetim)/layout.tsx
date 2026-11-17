import { requireAdmin } from "@/lib/admin";
import { PanelNav } from "./PanelNav";

export const dynamic = "force-dynamic";

export default async function YonetimLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="pn">
      <PanelNav email={user.email ?? ""} />
      <main className="pn-main">{children}</main>
    </div>
  );
}
