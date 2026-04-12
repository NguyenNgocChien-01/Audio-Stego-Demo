"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import cfg from "@/app/config/about.config.json";

// ─── Types ────────────────────────────────────────────────────────────────────
type FlowStep = { id: string; text: string };
type FlowData  = { label: string; steps: FlowStep[] };

// ─── useReveal ────────────────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Reveal wrapper ───────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, visible } = useReveal(0.3);
  useEffect(() => {
    if (!visible) return;
    let cur = 0;
    const step = Math.ceil(to / 40);
    const id = setInterval(() => {
      cur += step;
      if (cur >= to) { setVal(to); clearInterval(id); }
      else setVal(cur);
    }, 28);
    return () => clearInterval(id);
  }, [visible, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Magnetic word — hover nảy ────────────────────────────────────────────────
function MagWord({ word, delay, accent = false }: {
  word: string; delay: number; accent?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <span
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-block",
        marginRight: "0.28em",
        color: accent ? "var(--accent)" : "inherit",
        transform: hov
          ? "translateY(-10px) scale(1.1)"
          : "translateY(0) scale(1)",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        cursor: "default",
        animation: `wordDrop 0.5s ease ${delay}s both`,
      }}
    >
      {word}
    </span>
  );
}

// ─── Capacity bar ─────────────────────────────────────────────────────────────
function CapBar({ value, delay }: { value: number; delay: number }) {
  const { ref, visible } = useReveal(0.2);
  const label = value >= 85 ? "Cao" : value >= 65 ? "Trung bình" : "Vừa";
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
      <span style={{ fontSize: "0.68rem", color: "#888", minWidth: "56px" }}>Sức chứa</span>
      <div style={{ flex: 1, height: "3px", background: "rgba(0,0,0,0.1)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: visible ? `${value}%` : "0%",
          background: "var(--primary)",
          borderRadius: "2px",
          transition: `width 1.1s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        }} />
      </div>
      <span style={{ fontSize: "0.68rem", color: "#888", fontFamily: "monospace", minWidth: "60px" }}>{label}</span>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontSize: "0.74rem", fontWeight: 700, color: "#666",
    letterSpacing: "0.12em", textTransform: "uppercase",
    marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px",
  }}>
    <div style={{ width: "14px", height: "2px", background: "var(--accent)", borderRadius: "2px" }} />
    {children}
  </div>
);

// ─── Waveform ─────────────────────────────────────────────────────────────────
const BARS = [4,7,14,20,13,18,24,16,10,22,15,8,19,12,6,17,11,23,9,16,13,7,20,14,5];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const { hero, stats, algorithms, author } = cfg;

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "48px 28px", lineHeight: 1.6 }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{
        textAlign: "center", marginBottom: "60px",
        padding: "60px 32px", borderRadius: "20px",
        background: "linear-gradient(135deg,#f9f6f0 0%,#ede8df 100%)",
        border: "1.5px solid #000", boxShadow: "4px 4px 0 #000",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          display: "inline-block", background: "#000", color: "#fff",
          padding: "6px 18px", borderRadius: "20px",
          fontSize: "0.73rem", fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase",
          marginBottom: "22px",
          animation: "badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both",
        }}>
          {hero.badge}
        </div>

        <h1 style={{
          fontSize: "clamp(2rem,5vw,2.9rem)", fontWeight: 900,
          color: "var(--primary)", margin: "0 0 20px", lineHeight: 1.15,
        }}>
          <div style={{ marginBottom: "4px" }}>
            {hero.title_line1.map((w, i) => (
              <MagWord key={i} word={w} delay={0.35 + i * 0.08} />
            ))}
          </div>
          <div>
            {hero.title_line2.map((w, i) => (
              <MagWord key={i} word={w} delay={0.75 + i * 0.08} accent />
            ))}
          </div>
        </h1>

        <p style={{
          margin: "0 auto 28px", fontSize: "1rem",
          color: "var(--text-muted)", maxWidth: "560px", lineHeight: 1.75,
          animation: "fadeUp 0.6s ease 1.1s both",
        }}>
          {hero.subtitle}
        </p>

        {/* Waveform decoration */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "3px", height: "32px", animation: "fadeUp 0.5s ease 1.3s both",
        }}>
          {BARS.map((h, i) => (
            <div key={i} style={{
              width: "3px", height: `${h}px`,
              background: "var(--primary)", borderRadius: "2px", opacity: 0.4,
              animation: `barPulse 1.4s ease-in-out ${i * 0.06}s infinite alternate`,
            }} />
          ))}
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "60px" }}>
        {stats.map((s, i) => (
          <Reveal key={i} delay={i * 90}>
            <div className="hover-card" style={{
              background: "var(--surface)", borderRadius: "12px",
              border: "1.5px solid #000", padding: "22px 16px",
              boxShadow: "3px 3px 0 #000", textAlign: "center",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}>
              <div style={{
                fontSize: "2rem", fontWeight: 900, color: "var(--primary)",
                fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.1,
              }}>
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: "0.87rem", fontWeight: 700, margin: "6px 0 3px" }}>{s.label}</div>
              <div style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>{s.sub}</div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* ── ALGORITHMS ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "60px" }}>
        <Reveal><Label>Các kỹ thuật giấu tin</Label></Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {algorithms.map((algo, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="hover-card" style={{
                background: algo.bg, borderRadius: "10px",
                border: "1.5px solid #000", padding: "20px 24px",
                boxShadow: "2px 2px 0 #000",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", bottom: 0, left: 0,
                  height: "2px", width: "100%",
                  background: `linear-gradient(90deg, ${algo.tagColor}55, transparent)`,
                }} />
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <h4 style={{ margin: 0, fontSize: "0.96rem", fontWeight: 800 }}>{algo.title}</h4>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700,
                    background: algo.tagColor, color: "#fff",
                    padding: "2px 10px", borderRadius: "20px",
                    letterSpacing: "0.07em", textTransform: "uppercase",
                  }}>{algo.tag}</span>
                </div>
                <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.7 }}>
                  {algo.text}
                </p>
                {/* <CapBar value={algo.capacity} delay={i * 80 + 150} /> */}
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── AUTHOR ────────────────────────────────────────────────────────── */}
      <Reveal delay={80}>
        <Label>Về tác giả</Label>
        <div style={{
          display: "flex", alignItems: "center", gap: "28px",
          padding: "28px", background: "var(--surface-2)",
          borderRadius: "12px", border: "1.5px solid #000",
          boxShadow: "3px 3px 0 #000", flexWrap: "wrap",
        }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: "82px", height: "82px", borderRadius: "50%",
              background: "#000",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.9rem", color: "#fff", fontWeight: 900,
              border: "3px solid #000",
            }}>
              {author.initial}
            </div>
            <div style={{
              position: "absolute", inset: "-6px", borderRadius: "50%",
              border: "2px solid var(--accent)", opacity: 0.4,
              animation: "ringPulse 2.5s ease-in-out infinite",
            }} />
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "1.15rem", fontWeight: 900 }}>
              {author.name}
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.75 }}>
              {author.major} — {author.university} ({author.course})<br />
              <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>
                MSSV: {author.student_id}
              </span>
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {author.links.map(link => (
                <a key={link.label} href={link.href}
                  target="_blank" rel="noreferrer"
                  className="author-link"
                  style={{
                    fontSize: "0.8rem", fontWeight: 700, color: "#000",
                    textDecoration: "none", padding: "5px 16px",
                    borderRadius: "20px", border: "1.5px solid #000",
                    transition: "all 0.15s",
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── GLOBAL ANIMATIONS ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes wordDrop {
          from { opacity:0; transform:translateY(-14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes badgePop {
          from { opacity:0; transform:scale(0.7); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes barPulse {
          from { transform:scaleY(0.5); opacity:0.3; }
          to   { transform:scaleY(1.5); opacity:0.8; }
        }
        @keyframes ringPulse {
          0%,100% { transform:scale(1);    opacity:0.4; }
          50%      { transform:scale(1.13); opacity:0.1; }
        }
        .hover-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: 5px 5px 0 #000 !important;
        }
        .btn-primary:hover {
          transform: translateY(-2px) !important;
          box-shadow: 5px 5px 0 #333 !important;
        }
        .btn-outline:hover {
          background: #000 !important;
          color: #fff !important;
          transform: translateY(-2px) !important;
        }
        .author-link:hover {
          background: #000 !important;
          color: #fff !important;
        }
      `}</style>
    </div>
  );
}