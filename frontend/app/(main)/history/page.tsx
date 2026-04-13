"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// Định nghĩa kiểu dữ liệu cho một mục lịch sử
interface HistoryItem {
  id: number;
  action?: "Encode" | "Decode"; // Hành động (có thể undefine với các bản ghi cũ)
  filename: string;
  algo: string;
  type: string;
  date: string;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
    <div style={{ width: "16px", height: "2px", background: "#000" }} />{children}
  </div>
);

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Đọc dữ liệu từ LocalStorage khi component được mount
  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem("stego_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Lỗi đọc lịch sử", e);
      }
    }
  }, []);

  const clearHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử hoạt động?")) {
      localStorage.removeItem("stego_history");
      setHistory([]);
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit", minute: "2-digit", 
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  };

  // Dịch loại payload sang tiếng Việt
  const translateType = (type: string) => {
    switch (type) {
      case "text": return "Văn bản";
      case "image": return "Hình ảnh";
      case "audio": return "Âm thanh";
      case "file": return "Tệp tin";
      case "zip": return "Tệp ZIP";
      default: return type;
    }
  };

  // Khắc phục lỗi Hydration của Next.js (chỉ render sau khi đã có dữ liệu client)
  if (!mounted) return null;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 36px" }}>
      
      {/* ─── HEADER ─── */}
      <div style={{ marginBottom: "40px", paddingBottom: "24px", borderBottom: "2px solid #000", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "0.72rem", color: "#888", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600, marginBottom: "8px" }}>Trình duyệt cục bộ</div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--primary)", margin: "0 0 8px 0", lineHeight: 1.2 }}>Lịch sử hoạt động</h1>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>Các tệp âm thanh bạn đã xử lý gần đây trên thiết bị này.</p>
        </div>
        
        {history.length > 0 && (
          <button onClick={clearHistory} style={{ background: "transparent", color: "var(--error)", border: "1.5px solid var(--error)", padding: "8px 16px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.background = "var(--error)"; e.currentTarget.style.color = "#fff"; }}
            onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--error)"; }}
          >
            Xóa lịch sử
          </button>
        )}
      </div>

      {/* ─── CONTENT ─── */}
      {history.length === 0 ? (
        <div style={{ background: "var(--surface)", borderRadius: "10px", border: "1.5px dashed #ccc", padding: "60px 20px", textAlign: "center" }}>
          {/* <div style={{ fontSize: "3rem", color: "#eee", marginBottom: "16px" }}>🗄️</div>
          <h3 style={{ margin: "0 0 8px 0", color: "var(--text)" }}>Chưa có hoạt động nào</h3> */}
          <p style={{ margin: "0 0 24px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>Hệ thống chưa ghi nhận lần nhúng hoặc trích xuất nào trên trình duyệt này.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/encode"><button style={{ padding: "10px 20px", borderRadius: "6px", background: "#000", color: "#fff", border: "none", fontWeight: 600, fontSize: "0.85rem" }}>Bắt đầu Nhúng</button></Link>
            <Link href="/decode"><button style={{ padding: "10px 20px", borderRadius: "6px", background: "transparent", color: "#000", border: "1.5px solid #000", fontWeight: 600, fontSize: "0.85rem" }}>Trích xuất ngay</button></Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {history.map((item) => {
            // Phân loại màu sắc và nhãn cho hành động
            const isEncode = item.action !== "Decode"; // Nếu không có action (dữ liệu cũ), mặc định là Encode
            const actionLabel = isEncode ? "Nhúng" : "Trích xuất";
            const actionColor = isEncode ? "var(--primary)" : "var(--success)";
            const actionBg = isEncode ? "rgba(30,58,95,0.1)" : "rgba(26,107,60,0.1)";

            return (
              <div key={item.id} style={{ background: "var(--surface)", borderRadius: "8px", border: "1.5px solid #000", padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "2px 2px 0 #000", transition: "transform 0.1s" }}
                onMouseOver={e => e.currentTarget.style.transform = "translateX(4px)"}
                onMouseOut={e => e.currentTarget.style.transform = "translateX(0)"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  {/* Badge Hành động */}
                  <div style={{ background: actionBg, color: actionColor, padding: "6px 12px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", width: "100px", textAlign: "center", border: `1px solid ${actionColor}` }}>
                    {actionLabel}
                  </div>
                  
                  {/* Thông tin chính */}
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                      {item.filename}
                    </div>
                    <div style={{ display: "flex", gap: "16px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontWeight: 600, color: "#000" }}>Thuật toán:</span> {item.algo}
                      </span>
                      <span>|</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontWeight: 600, color: "#000" }}>Dữ liệu:</span> {translateType(item.type)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thời gian */}
                <div style={{ textAlign: "right", color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatDate(item.date)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}