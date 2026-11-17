"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Wipe } from "@/components/icons";

type Bottle = { src: string; alt: string };

/**
 * Buğulu cam: sayfa açıldığında ürünler buğunun arkasında durur. İmleç/parmakla silinir,
 * kaydırdıkça cam tamamen berraklaşır, bırakılan yerler yavaşça yeniden buğulanır.
 * prefers-reduced-motion açıksa canvas hiç çizilmez (CSS ile gizlenir).
 */
export function FogHero({ bottles }: { bottles: Bottle[] }) {
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const hero = heroRef.current, canvas = canvasRef.current;
    if (!hero || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fog = document.createElement("canvas");
    const fctx = fog.getContext("2d")!;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, interacted = false, wipedLen = 0, scrollFade = 0;
    let last: { x: number; y: number } | null = null;
    let hintTimer = 0;

    // Tohumlu rastgelelik: her açılışta aynı buğu deseni
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    function paintFog() {
      fog.width = canvas!.width; fog.height = canvas!.height;
      seed = 7;
      const g = fctx.createLinearGradient(0, 0, 0, fog.height);
      g.addColorStop(0, "rgba(236,242,243,0.90)");
      g.addColorStop(1, "rgba(222,232,234,0.94)");
      fctx.fillStyle = g;
      fctx.fillRect(0, 0, fog.width, fog.height);

      // Yoğuşma damlaları
      const count = Math.round((fog.width * fog.height) / (2600 * dpr));
      for (let i = 0; i < count; i++) {
        const x = rnd() * fog.width, y = rnd() * fog.height;
        const r = (rnd() ** 3 * 5 + 0.6) * dpr;
        fctx.beginPath();
        fctx.ellipse(x, y, r, r * (0.85 + rnd() * 0.3), 0, 0, Math.PI * 2);
        fctx.fillStyle = `rgba(196,212,215,${0.35 + rnd() * 0.35})`;
        fctx.fill();
        if (r > 2.2 * dpr) {
          fctx.beginPath();
          fctx.arc(x - r * 0.3, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
          fctx.fillStyle = "rgba(255,255,255,0.85)";
          fctx.fill();
        }
      }

      // Süzülen damla izleri (camın kendi kendine açtığı ince yollar)
      fctx.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 9; i++) {
        let x = rnd() * fog.width, y = rnd() * fog.height * 0.4;
        const len = (0.2 + rnd() * 0.5) * fog.height, step = 6 * dpr;
        fctx.lineCap = "round";
        fctx.lineWidth = (2 + rnd() * 3) * dpr;
        fctx.strokeStyle = "rgba(0,0,0,0.75)";
        fctx.beginPath(); fctx.moveTo(x, y);
        for (let t = 0; t < len; t += step) { x += (rnd() - 0.5) * 1.6 * dpr; y += step; fctx.lineTo(x, y); }
        fctx.stroke();
      }
      fctx.globalCompositeOperation = "source-over";
    }

    function resize() {
      const r = hero!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas!.width = Math.round(w * dpr); canvas!.height = Math.round(h * dpr);
      paintFog();
      ctx!.globalCompositeOperation = "source-over";
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.drawImage(fog, 0, 0);
    }

    function wipe(x0: number, y0: number, x1: number, y1: number, radius: number) {
      const c = ctx!;
      c.globalCompositeOperation = "destination-out";
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.ceil(dist / (radius * 0.25)));
      for (let i = 0; i <= steps; i++) {
        const x = (x0 + ((x1 - x0) * i) / steps) * dpr, y = (y0 + ((y1 - y0) * i) / steps) * dpr;
        const g = c.createRadialGradient(x, y, 0, x, y, radius * dpr);
        g.addColorStop(0, "rgba(0,0,0,0.9)");
        g.addColorStop(0.55, "rgba(0,0,0,0.55)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.beginPath(); c.arc(x, y, radius * dpr, 0, Math.PI * 2); c.fill();
      }
      c.globalCompositeOperation = "source-over";
      wipedLen += dist;
      if (wipedLen > Math.max(w, 600) * 1.4) setCleared(true);
    }

    // Bırakılan yerler yavaşça yeniden buğulanır
    function tick() {
      raf = 0;
      if (!visible || scrollFade >= 1) return;
      ctx!.globalAlpha = 0.006;
      ctx!.drawImage(fog, 0, 0);
      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const brush = () => Math.max(46, Math.min(w, h) * 0.085);

    function onMove(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      const p = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (!interacted) { interacted = true; window.clearTimeout(hintTimer); }
      if (last) wipe(last.x, last.y, p.x, p.y, brush());
      last = p;
    }
    const onLeave = () => { last = null; };

    // Etkileşim olmazsa camı kendisi bir kez siler: ne yapılacağını gösterir
    function autoWipe() {
      if (interacted) return;
      const t0 = performance.now(), dur = 1100;
      const pts = (t: number) => ({
        x: w * (0.48 + 0.42 * t),
        y: h * (0.62 - 0.22 * Math.sin(t * Math.PI * 1.15)),
      });
      let prev = pts(0);
      const step = (now: number) => {
        if (interacted) return;
        const t = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        const p = pts(e);
        wipe(prev.x, prev.y, p.x, p.y, brush() * 1.15);
        prev = p;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    function onScroll() {
      const r = hero!.getBoundingClientRect();
      scrollFade = Math.min(1, Math.max(0, -r.top / (r.height * 0.55)));
      canvas!.style.opacity = String(1 - scrollFade);
      if (scrollFade > 0.5) setCleared(true);
      if (scrollFade < 1) start();
    }

    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); });
    const ro = new ResizeObserver(() => resize());

    resize();
    ro.observe(hero);
    io.observe(hero);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerup", onLeave);
    canvas.addEventListener("pointercancel", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    hintTimer = window.setTimeout(autoWipe, 1200);
    start();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hintTimer);
      ro.disconnect(); io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerup", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section ref={heroRef} className="fog-hero" data-cleared={cleared} aria-labelledby="hero-baslik">
      <div className="fog-clear">
        <div className="fog-copy">
          <h1 id="hero-baslik" className="display fog-title">
            <span>Doğadan</span> <span>evinize</span> <span>temizlik.</span>
          </h1>
          <p className="fog-sub">Fosfat, klor ve amonyak içermeyen Prolinex formülleri. Her yüzey için ayrı bir şişe.</p>
          <div className="fog-actions">
            <Link href="/urunler" className="btn">Ürünleri gör</Link>
            <Link href="/paket/dortlu-mix" className="btn btn-line">4&apos;lü paket</Link>
          </div>
        </div>
        <div className="fog-bottles">
          {bottles.map((b, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={b.src} src={b.src} alt={b.alt} fetchPriority={i < 2 ? "high" : "auto"} />
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} className="fog-canvas" aria-hidden="true" />
      <p className="fog-hint" aria-hidden="true"><Wipe /> Camı sil</p>
    </section>
  );
}
