import Link from "next/link";
import Image from "next/image";
import type { ProductCard } from "@/lib/cards";
import { formatTL } from "@/lib/shared";

export function ShelfItem({ p, priority = false }: { p: ProductCard; priority?: boolean }) {
  return (
    <Link href={`/urun/${p.slug}`} className="shelf-item" style={{ ["--item" as string]: p.color }}>
      <div className="shelf-stage">
        <Image src={p.image} alt={p.name} width={360} height={480} sizes="(max-width: 640px) 60vw, 280px" priority={priority} />
      </div>
      <div className="shelf-meta">
        <strong>{p.name}</strong>
        {p.tagline && <span>{p.tagline}</span>}
        <span className="price">
          {p.labels.length > 1 ? `${formatTL(p.priceFrom)}’den başlayan` : formatTL(p.priceFrom)}
          {p.labels.length > 0 && <span className="muted" style={{ fontWeight: 400 }}> · {p.labels.join(" / ")}</span>}
        </span>
      </div>
    </Link>
  );
}
