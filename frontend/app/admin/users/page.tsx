"use client";
import { useState, useEffect } from "react";
import { AdminPageHeader } from "@/app/layout";
import { withAuth } from "@/app/auth/withAuth";

interface User { user_id: number; username: string; is_admin: boolean; created_at: string; }

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIsAdmin, setFilterIsAdmin] = useState<string>(""); 

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);

  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  const API_BASE = "http://localhost:8000/admin";

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filterIsAdmin !== "") params.append("is_admin", filterIsAdmin);
      const res = await fetch(`${API_BASE}/users?${params.toString()}`);
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => { fetchUsers(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterIsAdmin]);

  const handleAddUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) return;
    await fetch(`${API_BASE}/users`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, password: newPassword, is_admin: newIsAdmin })
    });
    setNewUsername(""); setNewPassword(""); setNewIsAdmin(false); fetchUsers();
  };

  const handleSaveEditUser = async (id: number) => {
    await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: editUsername, is_admin: editIsAdmin })
    });
    setEditUserId(null); fetchUsers();
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa tài khoản này?")) return;
    await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" }); fetchUsers();
  };

  const inputStyle = { padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "0.9rem", color: "var(--text)", outline: "none" };

  return (
    <div className="fade-in show" style={{ maxWidth: "1000px" }}>
      <AdminPageHeader 
        eyebrow="Phân quyền hệ thống" 
        title="Quản lý Tài khoản" 
        subtitle="Thêm tài khoản mới, phân quyền quản trị viên hoặc thiết lập lại thông tin người dùng."
        badge={`${users.length} Tài khoản`}
      />

      {/* THANH TÌM KIẾM & LỌC */}
      <div style={{ background: "var(--surface)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "var(--shadow)", display: "flex", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
        <input type="text" style={{...inputStyle, flex: 2}} placeholder="Nhập tên đăng nhập cần tìm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select style={{...inputStyle, flex: 1}} value={filterIsAdmin} onChange={e => setFilterIsAdmin(e.target.value)}>
          <option value="">-- Tất cả quyền hạn --</option>
          <option value="true">Chỉ hiện Admin</option>
          <option value="false">Chỉ hiện User thường</option>
        </select>
      </div>

      {/* FORM THÊM MỚI */}
      <div style={{ background: "var(--surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "var(--shadow)", marginBottom: "32px" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--primary)", marginBottom: "16px" }}>Đăng ký tài khoản mới</div>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr auto", gap: "16px", alignItems: "center" }}>
          <input style={inputStyle} placeholder="Tên đăng nhập mới" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
          <input type="password" style={inputStyle} placeholder="Mật khẩu" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <select style={inputStyle} value={newIsAdmin ? "true" : "false"} onChange={e => setNewIsAdmin(e.target.value === "true")}>
            <option value="false">User thường</option>
            <option value="true">Admin Quản trị</option>
          </select>
          <button onClick={handleAddUser} disabled={!newUsername || !newPassword} style={{ padding: "11px 24px", borderRadius: "8px", border: "none", background: "var(--primary)", color: "#fff", fontWeight: 600, cursor: (!newUsername || !newPassword) ? "not-allowed" : "pointer", opacity: (!newUsername || !newPassword) ? 0.6 : 1, transition: "0.2s" }}>
            + Thêm User
          </button>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", boxShadow: "var(--shadow)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "16px 24px", fontWeight: 600 }}>ID</th>
              <th style={{ padding: "16px 24px", fontWeight: 600 }}>Username</th>
              <th style={{ padding: "16px 24px", fontWeight: 600 }}>Phân quyền</th>
              <th style={{ padding: "16px 24px", fontWeight: 600 }}>Ngày tạo</th>
              <th style={{ padding: "16px 24px", fontWeight: 600, textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id} style={{ borderBottom: "1px solid var(--surface-3)", transition: "0.15s" }}>
                <td style={{ padding: "16px 24px", fontFamily: "'JetBrains Mono', monospace", color: "var(--text-muted)" }}>#{u.user_id}</td>
                
                <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--primary)" }}>
                  {editUserId === u.user_id ? (
                    <input style={{...inputStyle, padding: "8px 12px"}} value={editUsername} onChange={e => setEditUsername(e.target.value)} />
                  ) : u.username}
                </td>

                <td style={{ padding: "16px 24px" }}>
                  {editUserId === u.user_id ? (
                    <select style={{...inputStyle, padding: "8px 12px"}} value={editIsAdmin ? "true" : "false"} onChange={e => setEditIsAdmin(e.target.value === "true")}>
                      <option value="false">User thường</option>
                      <option value="true">Admin Quản trị</option>
                    </select>
                  ) : (
                    <span style={{ background: u.is_admin ? "var(--success-bg)" : "var(--surface-3)", color: u.is_admin ? "var(--success)" : "var(--text-2)", padding: "6px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, border: `1px solid ${u.is_admin ? "rgba(26,107,60,0.2)" : "var(--border)"}` }}>
                      {u.is_admin ? "⭐ Admin" : "Người dùng"}
                    </span>
                  )}
                </td>

                <td style={{ padding: "16px 24px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  {new Date(u.created_at).toLocaleString('vi-VN')}
                </td>

                <td style={{ padding: "16px 24px", textAlign: "right" }}>
                  {editUserId === u.user_id ? (
                    <button onClick={() => handleSaveEditUser(u.user_id)} style={{ color: "var(--primary)", border: "none", background: "none", marginRight: "16px", fontWeight: 600, cursor: "pointer" }}>Lưu lại</button>
                  ) : (
                    <button onClick={() => { setEditUserId(u.user_id); setEditUsername(u.username); setEditIsAdmin(u.is_admin); }} style={{ color: "var(--success)", border: "none", background: "none", marginRight: "16px", fontWeight: 600, cursor: "pointer" }}>Chỉnh sửa</button>
                  )}
                  <button onClick={() => handleDeleteUser(u.user_id)} style={{ color: "var(--error)", border: "none", background: "none", fontWeight: 600, cursor: "pointer", opacity: 0.8 }}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withAuth(UserManagement, { adminOnly: true });