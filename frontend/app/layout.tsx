// file: app/layout.tsx
"use client";
import "./globals.css";
import { AuthProvider } from "./auth/authContext";
import { LogoutButton } from "./auth/LogoutButton";
import { AlgorithmProvider } from './admin/algorithms/AlgorithmContext';
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// AdminPageHeader — dùng chung cho mọi trang con trong /admin
// Import: import { AdminPageHeader } from "@/app/layout";
// ─────────────────────────────────────────────────────────────────────────────
export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  badge,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  badge?: string;          // ví dụ "Bước 1" hay "3 thuật toán"
}) {
  return (
    <div style={{
      marginBottom: "36px",
      paddingBottom: "24px",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    }}>
      <div>
        <div style={{
          fontSize: "0.68rem", color: "var(--accent)",
          letterSpacing: "0.15em", textTransform: "uppercase",
          fontWeight: 600, marginBottom: "8px",
        }}>
          ◆ {eyebrow}
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.9rem", fontWeight: 700,
          color: "var(--primary)", margin: "0 0 8px 0",
          letterSpacing: "-0.02em", lineHeight: 1.2,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            {subtitle}
          </p>
        )}
      </div>
      {badge && (
        <div style={{
          background: "var(--primary)", color: "#fff",
          borderRadius: "10px", padding: "8px 16px",
          fontSize: "0.72rem", letterSpacing: "0.08em",
          textTransform: "uppercase", fontWeight: 600,
          border: "2px solid var(--accent)",
          flexShrink: 0, marginTop: "4px",
        }}>
          {badge}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Layout
// ─────────────────────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");

  const adminNav = [
    { href: "/admin",              label: "Tổng quan",  icon: "▣", desc: "Dashboard"           },
    { href: "/admin/algorithms",   label: "Thuật toán", icon: "⬡", desc: "Quản lý & kích hoạt" },
    { href: "/admin/users",        label: "Người dùng", icon: "◎", desc: "Tài khoản & quyền"   },
    { href: "/admin/transactions", label: "Lịch sử",    icon: "≡", desc: "Encode / Decode log"  },
  ];

  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Source+Sans+3:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{
        margin: 0, padding: 0,
        fontFamily: "'Source Sans 3', sans-serif",
        background: "#F7F4EF",
        minHeight: "100vh",
        color: "#1C1917",
      }}>
        <style>{`
          :root {
            --primary:       #1E3A5F;
            --primary-light: #2D5A8E;
            --accent:        #C8860A;
            --accent-light:  #F5D78A;
            --surface:       #FFFFFF;
            --surface-2:     #F7F4EF;
            --surface-3:     #EDE8DF;
            --text:          #1C1917;
            --text-2:        #44403C;
            --text-muted:    #78716C;
            --border:        #D6CFC4;
            --success:       #1A6B3C;
            --success-bg:    #F0FAF4;
            --error:         #9B1C1C;
            --shadow:        0 2px 12px rgba(30,58,95,0.08);
            --shadow-md:     0 4px 24px rgba(30,58,95,0.12);
          }
          * { box-sizing: border-box; }
          a { text-decoration: none; }
          button { cursor: pointer; }
          input, textarea, select { font-family: inherit; }

          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin  { to { transform: rotate(360deg); } }
          @keyframes pulse {
            0%,100% { box-shadow: 0 0 0 6px rgba(155,28,28,0.15); }
            50%     { box-shadow: 0 0 0 12px rgba(155,28,28,0.04); }
          }
        `}</style>
      <AuthProvider>
        <AlgorithmProvider>

          {/* ══════════════════════════════════════════════════
              ADMIN LAYOUT  (pathname starts with /admin)
          ══════════════════════════════════════════════════ */}
          {isAdminPage ? (
            <div style={{ display: "flex", minHeight: "100vh", background: "var(--surface-2)" }}>

              {/* ── Sidebar ─────────────────────────────────── */}
              <aside style={{
                width: "256px", minHeight: "100vh",
                background: "var(--primary)",
                display: "flex", flexDirection: "column",
                padding: "32px 0",
                position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100,
                boxShadow: "4px 0 20px rgba(30,58,95,0.15)",
              }}>

                {/* Logo */}
                <div style={{ padding: "0 28px", marginBottom: "40px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "36px", height: "36px",
                      background: "var(--accent)", borderRadius: "8px",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3 9 Q6 4 9 9 Q12 14 15 9" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                        <line x1="1" y1="9" x2="3" y2="9" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="15" y1="9" x2="17" y2="9" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                        StegoAudio
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "rgba(200,134,10,0.75)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, marginTop: "2px" }}>
                        Admin Panel
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nav */}
                <nav style={{ padding: "0 14px", flex: 1 }}>
                  {adminNav.map((item) => {
                    const isActive = item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                    return (
                      <Link key={item.href} href={item.href} style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "10px 14px", borderRadius: "8px", marginBottom: "2px",
                        color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                        background: isActive ? "rgba(200,134,10,0.15)" : "transparent",
                        borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                        fontSize: "0.875rem", fontWeight: isActive ? 600 : 400,
                        transition: "all 0.15s ease",
                      }}>
                        <span style={{ fontSize: "0.95rem", opacity: isActive ? 1 : 0.45, flexShrink: 0 }}>
                          {item.icon}
                        </span>
                        <div>
                          <div style={{ lineHeight: 1.2 }}>{item.label}</div>
                          <div style={{
                            fontSize: "0.62rem", marginTop: "1px", letterSpacing: "0.04em",
                            color: isActive ? "rgba(200,134,10,0.8)" : "rgba(255,255,255,0.22)",
                          }}>
                            {item.desc}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                {/* Exit */}
                <div style={{ padding: "18px 14px 0", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <LogoutButton />
                  <Link href="/encode" style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 14px", borderRadius: "8px",
                    color: "rgba(255,255,255,0.3)", fontSize: "0.82rem",
                    transition: "color 0.15s",
                  }}>
                    <span>←</span> Client
                  </Link>
                </div>
              </aside>

              {/* ── Main area ───────────────────────────────── */}
              <main style={{
                marginLeft: "256px", flex: 1,
                padding: "48px 52px",
                minHeight: "100vh",
                animation: "fadeSlideIn 0.2s ease",
              }}>
                {children}
              </main>
            </div>

          ) : (
            /* ══════════════════════════════════════════════════
                CLIENT LAYOUT  (encode / decode)
            ══════════════════════════════════════════════════ */
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

              {/* Header */}
              <header style={{
                position: "sticky", top: 0, zIndex: 50,
                background: "rgba(30,58,95,0.97)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(200,134,10,0.3)",
              }}>
                <div style={{
                  maxWidth: "1160px", margin: "0 auto", padding: "0 36px",
                  height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  {/* Logo */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: "36px", height: "36px", background: "var(--accent)",
                      borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3 9 Q6 4 9 9 Q12 14 15 9" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                        <line x1="1" y1="9" x2="3" y2="9" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="15" y1="9" x2="17" y2="9" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                        StegoAudio
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "rgba(200,134,10,0.8)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>
                        Giấu tin trong âm thanh
                      </div>
                    </div>
                  </div>

                  {/* Nav tabs */}
                  <nav style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.07)", padding: "4px", borderRadius: "10px" }}>
                    {[
                      { href: "/encode", label: "Giấu tin"    },
                      { href: "/decode", label: "Trích xuất"  },
                    ].map((item) => (
                      <Link key={item.href} href={item.href} style={{
                        padding: "7px 20px", borderRadius: "7px",
                        fontSize: "0.85rem", fontWeight: 500,
                        color: pathname === item.href ? "var(--primary)" : "rgba(255,255,255,0.65)",
                        background: pathname === item.href ? "#fff" : "transparent",
                        transition: "all 0.15s ease",
                        letterSpacing: "0.01em",
                      }}>
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Discreet admin link */}
                  <LogoutButton />
                </div>
              </header>

              {/* Gold accent stripe */}
              <div style={{
                height: "3px",
                background: "linear-gradient(90deg, var(--accent) 0%, var(--primary-light) 50%, var(--accent) 100%)",
              }} />

              <main style={{ flex: 1 }}>{children}</main>

              {/* Footer */}
              <footer style={{ background: "var(--primary)", borderTop: "3px solid var(--accent)", padding: "28px 36px" }}>
                <div style={{ maxWidth: "1160px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", color: "#fff", fontWeight: 600, marginBottom: "4px" }}>
                      Hệ thống giấu tin trong âm thanh số
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                      Audio Steganography System — Đồ án luận văn tốt nghiệp
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.82rem", color: "rgba(200,134,10,0.9)", fontWeight: 600 }}>Nguyễn Ngọc Chiến</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "2px", fontFamily: "'JetBrains Mono', monospace" }}>B220341</div>
                  </div>
                </div>
              </footer>
            </div>
          )}

        </AlgorithmProvider>
      </AuthProvider>
      </body>
    </html>
  );
}