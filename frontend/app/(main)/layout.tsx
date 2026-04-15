"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/about",   label: "Giới thiệu" },
  { href: "/encode",  label: "Giấu tin"  },
  { href: "/decode",  label: "Trích xuất" },
  { href: "/history", label: "Lịch sử" },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  /* Khoá scroll khi menu mở */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  /* Đóng menu khi chuyển trang */
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ─── GLOBAL STYLES ─────────────────────────────────────── */}
      <style>{`
        /* Bottom nav padding on mobile */
        @media (max-width: 768px) {
          .main-content { padding-bottom: 68px !important; }
        }

        /* Drawer slide-in */
        @keyframes drawerIn {
          from { transform: translateY(-12px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .drawer-nav { animation: drawerIn 0.22s ease; }

        /* Fade page */
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Bottom tab active pip */
        .tab-pip {
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--accent, #c8860a);
          margin: 2px auto 0;
          opacity: 0;
          transform: scale(0);
          transition: opacity 0.2s, transform 0.2s;
        }
        .tab-active .tab-pip { opacity: 1; transform: scale(1); }

        /* Hamburger lines */
        .hbg span {
          display: block; width: 22px; height: 2px;
          background: #fff; border-radius: 2px;
          transition: transform 0.25s, opacity 0.25s;
          transform-origin: center;
        }
        .hbg.open span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
        .hbg.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .hbg.open span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }
      `}</style>

      {/* ─── HEADER ────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(30,58,95,0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(200,134,10,0.3)",
      }}>
        <div style={{
          maxWidth: "1160px", margin: "0 auto",
          padding: "0 24px", height: "60px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>

          {/* Logo */}
          <Link href="/encode" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <div style={{
              width: "36px", height: "36px",
              background: "var(--accent, #c8860a)", borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9 Q6 4 9 9 Q12 14 15 9" stroke="var(--primary,#1e3a5f)" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <line x1="1" y1="9" x2="3" y2="9" stroke="var(--primary,#1e3a5f)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="15" y1="9" x2="17" y2="9" stroke="var(--primary,#1e3a5f)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{
                fontFamily: "'Playfair Display', serif", fontWeight: 700,
                fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.1,
              }}>
                StegoAudio
              </div>
              <div style={{
                fontSize: "clamp(0.5rem, 1.2vw, 0.6rem)",
                color: "rgba(200,134,10,0.85)", letterSpacing: "0.15em",
                textTransform: "uppercase", fontWeight: 500,
              }}>
                Ẩn danh & Bảo mật
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav style={{
            display: "flex", alignItems: "center", gap: "4px",
            background: "rgba(255,255,255,0.07)", padding: "4px", borderRadius: "10px",
          }}
            className="desktop-nav"
          >
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} style={{
                padding: "7px 18px", borderRadius: "7px",
                fontSize: "0.85rem", fontWeight: 500, textDecoration: "none",
                color: pathname === item.href ? "var(--primary,#1e3a5f)" : "rgba(255,255,255,0.65)",
                background: pathname === item.href ? "#fff" : "transparent",
                transition: "all 0.15s ease",
                // ẩn trên mobile
                display: "var(--desktop-nav-display, flex)",
              }}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Hamburger — chỉ hiện trên mobile */}
          <button
            className={`hbg ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Mở menu"
            style={{
              display: "none", // override bằng media query bên dưới
              flexDirection: "column", gap: "6px",
              background: "none", border: "none", cursor: "pointer",
              padding: "8px",
            }}
          >
            <span /><span /><span />
          </button>

          <div style={{ width: "140px" }} className="header-spacer" />
        </div>

        {/* ─── Mobile dropdown drawer ─── */}
        {menuOpen && (
          <div className="drawer-nav" style={{
            background: "rgba(20,45,80,0.98)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(200,134,10,0.2)",
            padding: "8px 16px 16px",
          }}>
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 16px", borderRadius: "10px",
                fontSize: "0.95rem", fontWeight: 500, textDecoration: "none",
                color: pathname === item.href ? "#fff" : "rgba(255,255,255,0.65)",
                background: pathname === item.href ? "rgba(200,134,10,0.25)" : "transparent",
                borderLeft: pathname === item.href ? "3px solid var(--accent,#c8860a)" : "3px solid transparent",
                transition: "all 0.15s",
                marginBottom: "2px",
              }}>
           
                {item.label}
                {pathname === item.href && (
                  <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "rgba(200,134,10,0.8)", letterSpacing: "0.1em" }}>
                    ĐANG XEM
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Inline style để toggle hamburger / desktop nav */}
        <style>{`
          @media (max-width: 768px) {
            .desktop-nav { display: none !important; }
            .hbg { display: flex !important; }
            .header-spacer { display: none !important; }
          }
        `}</style>
      </header>

      {/* Gold accent stripe */}
      <div style={{
        height: "3px",
        background: "linear-gradient(90deg, var(--accent,#c8860a) 0%, #f5d08a 50%, var(--accent,#c8860a) 100%)",
      }} />

      {/* ─── MAIN ──────────────────────────────────────────────── */}
      <main className="main-content" style={{ flex: 1, animation: "fadeSlideIn 0.3s ease" }}>
        {children}
      </main>

      {/* ─── FOOTER ────────────────────────────────────────────── */}
      <footer style={{
        background: "var(--primary, #1e3a5f)",
        borderTop: "3px solid var(--accent, #c8860a)",
        padding: "24px",
        /* Đẩy lên trên bottom nav trên mobile */
        marginBottom: 0,
      }}>
        <style>{`
          @media (max-width: 768px) {
            .footer-inner { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
            .footer-right  { text-align: left !important; }
            footer { margin-bottom: 68px !important; }
          }
        `}</style>
        <div className="footer-inner" style={{
          maxWidth: "1160px", margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", color: "#fff", fontWeight: 600, marginBottom: "4px" }}>
              Hệ thống giấu tin trong âm thanh số
            </div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
              Stateless Architecture — Không lưu trữ dữ liệu người dùng
            </div>
          </div>
          <div className="footer-right" style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.82rem", color: "rgba(200,134,10,0.9)", fontWeight: 600 }}>Nguyễn Ngọc Chiến</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "2px", fontFamily: "'JetBrains Mono', monospace" }}>B2203431</div>
          </div>
        </div>
      </footer>

      {/* ─── BOTTOM TAB BAR (mobile only) ──────────────────────── */}
      <nav style={{
        display: "none", // override bằng media query
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60,
        background: "rgba(20,45,80,0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(200,134,10,0.35)",
        height: "64px",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 8px",
      }}>
        <style>{`
          @media (max-width: 768px) {
            nav.bottom-tab-bar { display: flex !important; }
          }
        `}</style>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "tab-active" : ""}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                textDecoration: "none", padding: "6px 4px",
                borderRadius: "10px",
                background: active ? "rgba(200,134,10,0.15)" : "transparent",
                transition: "background 0.2s",
              }}
            >

              <span style={{
                fontSize: "0.65rem", marginTop: "3px", fontWeight: active ? 700 : 400,
                color: active ? "rgba(200,134,10,1)" : "rgba(255,255,255,0.5)",
                letterSpacing: "0.02em",
                transition: "color 0.2s",
              }}>
                {item.label}
              </span>
              <div className="tab-pip" />
            </Link>
          );
        })}
      </nav>
      <div className="bottom-tab-bar" />

    </div>
  );
}