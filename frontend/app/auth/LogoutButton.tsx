"use client";
import { useAuth } from "./authContext";
import { useState } from "react";

export function LogoutButton() {
  const { logout, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 14px",
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "0.85rem",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
        }}
      >
        <div style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.7rem",
          fontWeight: 700,
        }}>
          {user.username[0].toUpperCase()}
        </div>
        <span>{user.username}</span>
        <span style={{ fontSize: "0.7rem" }}>▼</span>
      </button>

      {showMenu && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: "8px",
          background: "var(--primary)",
          border: "1px solid rgba(200,134,10,0.4)",
          borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          zIndex: 1000,
          minWidth: "180px",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(200,134,10,0.2)",
            fontSize: "0.78rem",
            color: "rgba(255,255,255,0.6)",
          }}>
            <div style={{ fontWeight: 600, color: "#fff", marginBottom: "2px" }}>
              {user.username}
            </div>
            <div>{user.role === "admin" ? "Quản trị viên" : "Người dùng"}</div>
          </div>

          {user.role === "admin" && (
            <a href="/admin" onClick={() => setShowMenu(false)} style={{
              display: "block",
              padding: "10px 16px",
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.85rem",
              borderBottom: "1px solid rgba(200,134,10,0.2)",
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(200,134,10,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            }}>
              ▣ Bảng điều khiển
            </a>
          )}

          <button
            onClick={() => {
              setShowMenu(false);
              logout();
            }}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "0.85rem",
              textAlign: "left",
              cursor: "pointer",
              transition: "background 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(155,28,28,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <span>⎋</span> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
