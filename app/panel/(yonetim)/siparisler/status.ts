export const STATUS = {
  bekliyor: "Yeni (ödendi)",
  hazirlaniyor: "Hazırlanıyor",
  kargoya_verildi: "Kargoda",
  teslim_edildi: "Teslim edildi",
  iade_talebi: "İade talebi",
  iade_edildi: "İade edildi",
  iptal: "İptal",
  odeme_bekleniyor: "Ödeme yarım kaldı",
  odeme_basarisiz: "Ödeme başarısız",
} as const;

export const EDITABLE = ["bekliyor", "hazirlaniyor", "kargoya_verildi", "teslim_edildi", "iade_talebi", "iade_edildi", "iptal"] as const;

export function statusTone(s: string) {
  if (s === "bekliyor" || s === "iade_talebi") return "warn";
  if (s === "teslim_edildi" || s === "kargoya_verildi") return "ok";
  if (s === "odeme_basarisiz" || s === "iptal") return "bad";
  if (s === "odeme_bekleniyor" || s === "iade_edildi") return "off";
  return undefined;
}
