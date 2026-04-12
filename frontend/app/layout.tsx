"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Lưu ý: Đã loại bỏ AuthProvider vì hệ thống không còn sử dụng đăng nhập.
// Bạn có thể giữ AlgorithmProvider nếu nó dùng để fetch danh sách thuật toán tĩnh từ Backend.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
            --error:         #9B1C1C;
            --shadow:        0 2px 12px rgba(30,58,95,0.08);
          }
          * { box-sizing: border-box; }
          a { text-decoration: none; }
          button { cursor: pointer; }
          
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

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
              <Link href="/encode" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
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
                    Ẩn danh & Bảo mật
                  </div>
                </div>
              </Link>

              {/* Nav tabs */}
              <nav style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.07)", padding: "4px", borderRadius: "10px" }}>
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

              <div style={{ width: "140px" }} /> {/* Spacer cân bằng layout */}
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
            <div style={{ maxWidth: "1160px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", color: "#fff", fontWeight: 600, marginBottom: "4px" }}>
                  Hệ thống giấu tin trong âm thanh số
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                  Stateless Architecture — Không lưu trữ dữ liệu người dùng
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.82rem", color: "rgba(200,134,10,0.9)", fontWeight: 600 }}>Nguyễn Ngọc Chiến</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "2px", fontFamily: "'JetBrains Mono', monospace" }}>B220341</div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}