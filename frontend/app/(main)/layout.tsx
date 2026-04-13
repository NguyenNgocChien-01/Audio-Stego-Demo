"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        @media (max-width: 768px) {
          .header-container { padding: 0 16px !important; height: auto !important; }
          .header-logo { gap: 8px !important; }
          .header-logo-text { font-size: 0.95rem !important; }
          .header-logo-subtitle { font-size: 0.5rem !important; }
          .header-nav { display: none !important; }
          .header-spacer { display: none !important; }
        }
        
        @media (max-width: 640px) {
          .header-container { height: auto !important; padding: 12px 12px !important; }
          .header-logo { gap: 6px !important; }
          .header-logo-icon { width: 32px !important; height: 32px !important; }
          .header-logo-icon svg { width: 16px !important; height: 16px !important; }
          .header-logo-text { font-size: 0.9rem !important; }
          .footer-container { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .footer-section-right { text-align: left !important; }
        }
      `}</style>
      
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(30,58,95,0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(200,134,10,0.3)",
      }}>
        <div className="header-container" style={{
          maxWidth: "1160px", margin: "0 auto", padding: "0 36px",
          height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <Link href="/encode" className="header-logo" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div className="header-logo-icon" style={{
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
              <div className="header-logo-text" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                StegoAudio
              </div>
              <div className="header-logo-subtitle" style={{ fontSize: "0.6rem", color: "rgba(200,134,10,0.8)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>
                Ẩn danh & Bảo mật
              </div>
            </div>
          </Link>

          {/* Nav tabs */}
          <nav className="header-nav" style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.07)", padding: "4px", borderRadius: "10px" }}>
            {[
              { href: "/about", label: "Giới thiệu" },
              { href: "/encode", label: "Giấu tin" },
              { href: "/decode", label: "Trích xuất" },
              { href: "/history", label: "Lịch sử" }, 
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{
                padding: "7px 20px", borderRadius: "7px",
                fontSize: "0.85rem", fontWeight: 500,
                color: pathname === item.href ? "var(--primary)" : "rgba(255,255,255,0.65)",
                background: pathname === item.href ? "#fff" : "transparent",
                transition: "all 0.15s ease",
              }}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-spacer" style={{ width: "140px" }} /> {/* Spacer cân bằng layout */}
        </div>
      </header>

      {/* Gold accent stripe */}
      <div style={{
        height: "3px",
        background: "linear-gradient(90deg, var(--accent) 0%, var(--primary-light) 50%, var(--accent) 100%)",
      }} />

      {/* Main content */}
      <main style={{ 
        flex: 1,
        animation: "fadeSlideIn 0.3s ease"
      }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ background: "var(--primary)", borderTop: "3px solid var(--accent)", padding: "28px 36px" }}>
        <div className="footer-container" style={{ maxWidth: "1160px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", color: "#fff", fontWeight: 600, marginBottom: "4px" }}>
              Hệ thống giấu tin trong âm thanh số
            </div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
              Stateless Architecture — Không lưu trữ dữ liệu người dùng
            </div>
          </div>
          <div className="footer-section-right" style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.82rem", color: "rgba(200,134,10,0.9)", fontWeight: 600 }}>Nguyễn Ngọc Chiến</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "2px", fontFamily: "'JetBrains Mono', monospace" }}>B2203431</div>
          </div>
        </div>
      </footer>

    </div>
  );
}