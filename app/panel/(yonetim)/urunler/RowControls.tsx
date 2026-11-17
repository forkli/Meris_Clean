"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveProduct, setProductFlag } from "./actions";

export function RowControls({ id, active, featured }: { id: string; active: boolean; featured: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useOptimistic({ active, featured });

  const flip = (field: "active" | "featured") =>
    start(async () => {
      const next = !state[field];
      setState({ ...state, [field]: next });
      const res = await setProductFlag(id, field, next);
      if (res?.error) alert(res.error);
      router.refresh();
    });

  return (
    <>
      <td>
        <button className="toggle" aria-pressed={state.active} aria-label="Yayında" onClick={() => flip("active")} disabled={pending} />
      </td>
      <td className="hide-sm">
        <button className="toggle" aria-pressed={state.featured} aria-label="Öne çıkan" onClick={() => flip("featured")} disabled={pending} />
      </td>
      <td className="hide-sm">
        <div className="pn-actions">
          <button className="btn btn-line btn-sm" aria-label="Yukarı taşı" disabled={pending} onClick={() => start(async () => { await moveProduct(id, -1); router.refresh(); })}>↑</button>
          <button className="btn btn-line btn-sm" aria-label="Aşağı taşı" disabled={pending} onClick={() => start(async () => { await moveProduct(id, 1); router.refresh(); })}>↓</button>
        </div>
      </td>
    </>
  );
}
