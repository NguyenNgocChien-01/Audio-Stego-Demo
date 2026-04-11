// file: app/admin/page.tsx
"use client";
import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/app/layout";
import { withAuth } from "../auth/withAuth";

interface Stats {
  total_algorithms: number;
  active_algorithms: number;
  total_users: number;
  total_transactions: number;
  encode_count: number;
  decode_count: number;
}

// app/admin/page.tsx
function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats từ backend — điều chỉnh endpoint nếu cần
    Promise.all([
      fetch("http://localhost:8000/admin/algorithms").then(r => r.json()),
      fetch("http://localhost:8000/admin/users").then(r => r.json()).catch(() => []),
      fetch("http://localhost:8000/admin/transactions").then(r => r.json()).catch(() => []),
    ]).then(([algos, users, txs]) => {
      setStats({
        total_algorithms:  algos.length ?? 0,
        active_algorithms: algos.filter((a: any) => a.is_active).length ?? 0,
        total_users:       users.length ?? 0,
        total_transactions: txs.length ?? 0,
        encode_count: txs.filter((t: any) => t.type === "encode").length ?? 0,
        decode_count: txs.filter((t: any) => t.type === "decode").length ?? 0,
      });
    }).catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: "Thuật toán",        value: `${stats.active_algorithms} / ${stats.total_algorithms}`, sub: "đang hoạt động", icon: "⬡", color: "var(--primary)" },
    { label: "Người dùng",        value: stats.total_users,         sub: "tài khoản",    icon: "◎", color: "#2D5A8E" },
    { label: "Giao dịch",         value: stats.total_transactions,  sub: "tổng cộng",    icon: "≡", color: "var(--accent)" },
    { label: "Encode / Decode",   value: `${stats.encode_count} / ${stats.decode_count}`, sub: "lượt xử lý", icon: "⇄", color: "var(--success)" },
  ] : [];

  return (
    <div style={{ maxWidth: "960px" }}>
      <AdminPageHeader
        eyebrow="Bảng điều khiển"
        title="Tổng quan hệ thống"
        subtitle="Theo dõi hoạt động và trạng thái các thành phần của StegoAudio."
        badge="Dashboard"
      />

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-muted)", padding: "40px 0" }}>
          <span style={{ display: "inline-block", width: "18px", height: "18px", border: "2px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Đang tải dữ liệu...
        </div>
      ) : !stats ? (
        <div style={{ padding: "40px", textAlign: "center", background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          Không thể kết nối backend. Kiểm tra FastAPI server tại <code>localhost:8000</code>.
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
            {statCards.map(card => (
              <div key={card.label} style={{
                background: "var(--surface)", borderRadius: "14px",
                border: "1px solid var(--border)", padding: "20px 22px",
                boxShadow: "var(--shadow)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {card.label}
                  </div>
                  <span style={{ fontSize: "1rem", color: card.color, opacity: 0.7 }}>{card.icon}</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.6rem", fontWeight: 700, color: card.color, lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "6px" }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div style={{ background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "3px", height: "16px", background: "var(--accent)", borderRadius: "2px" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Truy cập nhanh</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: "var(--border)" }}>
              {[
                { href: "/admin/algorithms",   label: "Quản lý thuật toán",     icon: "⬡", desc: "Thêm, sửa, bật/tắt thuật toán" },
                { href: "/admin/users",        label: "Quản lý người dùng",     icon: "◎", desc: "Tài khoản và phân quyền"        },
                { href: "/admin/transactions", label: "Xem lịch sử giao dịch",  icon: "≡", desc: "Log encode / decode"             },
              ].map(link => (
                <a key={link.href} href={link.href} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "20px 24px", background: "var(--surface)",
                  transition: "background 0.15s",
                }}>
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "9px", flexShrink: 0,
                    background: "rgba(30,58,95,0.07)", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", color: "var(--primary)",
                  }}>
                    {link.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--primary)", marginBottom: "2px" }}>{link.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{link.desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: "0.9rem", opacity: 0.4 }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default withAuth(AdminDashboard, { adminOnly: true });