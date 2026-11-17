// Tek çizgi kalınlığında (1.6) elle çizilmiş ikonlar.
type P = React.SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", "aria-hidden": true } as const;

export const BottleMark = (p: P) => (
  <svg {...base} viewBox="0 0 32 32" {...p}>
    <path d="M11 5h8.5l2.5 2.2h-3" />
    <path d="M12.5 5v3.2c0 .6-.3 1-.8 1.3C9.6 11 8.5 13.6 8.5 16.6V26a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9.4c0-3-1.1-5.6-3.2-7.1-.5-.3-.8-.7-.8-1.3V5" />
    <path d="M8.6 21c3 1.6 6.3-1.4 9.4 0 1.3.6 2.4.6 3.5.1" />
    <path d="M25 6.5l1.2-1.2M25.6 10h1.8M24.5 3.6V2" />
  </svg>
);
export const Bag = (p: P) => (
  <svg {...base} {...p}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
);
export const Close = (p: P) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const Menu = (p: P) => (<svg {...base} {...p}><path d="M4 8h16M4 16h16" /></svg>);
export const Wipe = (p: P) => (
  <svg {...base} {...p}><path d="M3 16c3-5 6-5 8-2s5 3 10-4" /><path d="M14 4l2 2M18 3v2" /></svg>
);
export const WhatsApp = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 20l1.3-3.8A8 8 0 1 1 8 19l-4 1Z" />
    <path d="M9.2 8.6c.2-.4.6-.4.8-.1l.9 1.6c.1.2 0 .5-.1.7l-.5.5c.5 1 1.3 1.8 2.3 2.3l.5-.5c.2-.2.5-.2.7-.1l1.6.9c.3.2.3.6-.1.8-1 .8-2.3.7-3.6 0a8 8 0 0 1-3.3-3.3c-.7-1.4-.7-2.6.2-3.6Z" />
  </svg>
);
export const Instagram = (p: P) => (
  <svg {...base} {...p}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><path d="M16.6 7.4h.01" /></svg>
);
export const Arrow = (p: P) => (<svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
