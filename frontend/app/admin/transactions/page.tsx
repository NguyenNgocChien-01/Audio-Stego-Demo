"use client";
import { useState, useEffect } from "react";
import { AdminPageHeader } from "@/app/layout";
import { withAuth } from "@/app/auth/withAuth";
import { useAuth } from "@/app/auth/authContext";

interface User { user_id: number; username: string; }
interface AudioMetric { mse: number | null; snr: number | null; psnr: number | null; capacity_bytes: number | null; }
interface Transaction { transaction_id: number; action_type: string; payload_type: string; status: string; timestamp: string; user: User | null; metrics: AudioMetric | null; }

function TransactionManagement() {
  const { getAccessToken } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterAction, setFilterAction] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUserId, setFilterUserId] = useState("");

  const API_BASE = "http://localhost:8000/admin";

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const params = new URLSearchParams();
      if (filterAction) params.append("action_type", filterAction);
      if (filterStatus) params.append("status", filterStatus);
      if (filterUserId) params.append("user_id", filterUserId);
      const res = await fetch(`${API_BASE}/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTransactions(await res.json());
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    const delay = setTimeout(() => { fetchTransactions(); }, 300);
    return () => clearTimeout(delay);
  }, [filterAction, filterStatus, filterUserId]);

  const handleDelete = async (id: number) => {
    if (!confirm("Hành động này sẽ xóa vĩnh viễn lịch sử và các chỉ số đo lường (Metrics). Tiếp tục?")) return;
    try {
      const token = await getAccessToken();
      await fetch(`${API_BASE}/transactions/${id}`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransactions();
    } catch (err) { console.error(err); }
  };

  const inputStyle = { padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "0.9rem", color: "var(--text)", outline: "none", flex: 1, minWidth: "150px" };

  return (
    <div className="fade-in show" style={{ maxWidth: "1100px" }}>
      <AdminPageHeader 
        eyebrow="Giám sát hoạt động" 
        title="Lịch sử Giao dịch" 
        subtitle="Theo dõi toàn bộ quá trình giấu tin (Encode) và trích xuất (Decode), kèm theo các chỉ số đo lường chất lượng âm thanh."
        badge={`${transactions.length} Giao dịch`}
      />

      {/* THANH BỘ LỌC */}
      <div style={{ background: "var(--surface)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "var(--shadow)", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", marginBottom: "24px" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase", marginRight: "8px" }}>Bộ lọc</div>
        
        <select style={inputStyle} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">-- Mọi Hành động --</option>
          <option value="Encode">Giấu tin (Encode)</option>
          <option value="Decode">Giải mã (Decode)</option>
        </select>

        <select style={inputStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">-- Mọi Trạng thái --</option>
          <option value="Success">Thành công (Success)</option>
          <option value="Failed">Thất bại (Failed)</option>
        </select>

        <input type="number" style={inputStyle} placeholder="Lọc theo ID Người dùng..." value={filterUserId} onChange={e => setFilterUserId(e.target.value)} />
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflowX: "auto", boxShadow: "var(--shadow)" }}>
        {isLoading && <div style={{ padding: "12px", textAlign: "center", color: "var(--primary)", fontSize: "0.9rem", background: "var(--surface-2)", fontWeight: 600 }}>Đang tải dữ liệu...</div>}
        
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "16px 20px", fontWeight: 600 }}>Mã GD</th>
              <th style={{ padding: "16px 20px", fontWeight: 600 }}>Tài khoản</th>
              <th style={{ padding: "16px 20px", fontWeight: 600 }}>Nghiệp vụ</th>
              <th style={{ padding: "16px 20px", fontWeight: 600 }}>Chỉ số đo lường</th>
              <th style={{ padding: "16px 20px", fontWeight: 600 }}>Trạng thái</th>
              <th style={{ padding: "16px 20px", fontWeight: 600 }}>Thời gian</th>
              <th style={{ padding: "16px 20px", fontWeight: 600, textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && !isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)", fontSize: "0.95rem" }}>Không tìm thấy giao dịch nào phù hợp với bộ lọc.</td></tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.transaction_id} style={{ borderBottom: "1px solid var(--surface-3)", transition: "0.15s" }}>
                  <td style={{ padding: "16px 20px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "var(--text-muted)" }}>#{tx.transaction_id}</td>
                  
                  <td style={{ padding: "16px 20px" }}>
                    {tx.user ? (
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--primary)" }}>{tx.user.username}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>ID: {tx.user.user_id}</div>
                      </div>
                    ) : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Khách ẩn danh</span>}
                  </td>

                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ background: tx.action_type === "Encode" ? "var(--surface-3)" : "rgba(45,90,142,0.1)", color: tx.action_type === "Encode" ? "var(--text-2)" : "var(--primary-light)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                      {tx.action_type}
                    </span>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px", fontWeight: 500 }}>Dữ liệu: <span style={{color: "var(--text-2)"}}>{tx.payload_type}</span></div>
                  </td>

                  <td style={{ padding: "16px 20px", fontSize: "0.85rem", color: "var(--text-2)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {tx.metrics ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div>PSNR: <strong style={{color: "var(--primary)"}}>{tx.metrics.psnr?.toFixed(2) || "N/A"}</strong> dB</div>
                        <div>MSE: <strong>{tx.metrics.mse?.toFixed(4) || "N/A"}</strong></div>
                      </div>
                    ) : <span style={{ color: "var(--text-muted)", fontFamily: "'Source Sans 3', sans-serif" }}>Chưa đo lường</span>}
                  </td>

                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ background: tx.status === "Success" ? "var(--success-bg)" : "rgba(155,28,28,0.08)", color: tx.status === "Success" ? "var(--success)" : "var(--error)", padding: "6px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, border: `1px solid ${tx.status === "Success" ? "rgba(26,107,60,0.2)" : "rgba(155,28,28,0.2)"}` }}>
                      {tx.status === "Success" ? "Thành công" : "Thất bại"}
                    </span>
                  </td>

                  <td style={{ padding: "16px 20px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {new Date(tx.timestamp).toLocaleString('vi-VN')}
                  </td>

                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <button onClick={() => handleDelete(tx.transaction_id)} style={{ color: "var(--error)", border: "none", background: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", opacity: 0.8 }}>Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withAuth(TransactionManagement, { adminOnly: true });