import { NextResponse, type NextRequest } from "next/server";
import { publicClient } from "@/lib/supabase/clients";

export const dynamic = "force-dynamic";

// Vercel cron her gün çağırır: Supabase ücretsiz planı 7 gün istek almazsa projeyi durdurur.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { error } = await publicClient().from("settings").select("id").limit(1);
  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
