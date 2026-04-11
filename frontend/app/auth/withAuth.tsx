"use client";
/**
 * app/auth/withAuth.tsx
 * ─────────────────────────────────────────────────────────────
 * 1. withAuth(Component, { adminOnly? })
 *    HOC bảo vệ route — tự redirect về /login nếu chưa đăng nhập
 *    Dùng: export default withAuth(MyPage)
 *          export default withAuth(AdminPage, { adminOnly: true })
 *
 * 2. useAuthFetch()
 *    Hook gọi API — tự đính kèm Bearer token, xử lý 401
 *    Dùng: const authFetch = useAuthFetch()
 *          const data = await authFetch("/stego/encode", { method:"POST", body:fd })
 *
 * 3. UserMenu
 *    Component góc trên phải — hiển thị tên user + nút đăng xuất
 *    Dùng: <UserMenu />
 */

import {
  useEffect, useState, useCallback,
  ComponentType, ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./authContext";

const API = "http://localhost:8000";

// ─────────────────────────────────────────────────────────────
// 1. withAuth HOC
// ─────────────────────────────────────────────────────────────
interface WithAuthOptions {
  adminOnly?: boolean;
}

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {},
) {
  return function ProtectedPage(props: P) {
    const { user, loading, hydrated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Wait for hydration to complete before making routing decisions
      if (!hydrated) return;
      if (loading) return;
      if (!user) {
        router.replace("/login");
        return;
      }
      if (options.adminOnly && user.role !== "admin") {
        router.replace("/encode"); // user thường không được vào admin
      }
    }, [user, loading, hydrated, router]);

    // Loading screen - show while hydrating or loading or no user
    if (!hydrated || loading || !user) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "#F7F4EF",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "36px", height: "36px",
              border: "3px solid #D6CFC4",
              borderTopColor: "#1E3A5F",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              margin: "0 auto 16px",
            }} />
            <div style={{
              fontSize: "0.78rem", color: "#78716C",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              Đang xác thực...
            </div>
          </div>
          <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
        </div>
      );
    }

    // Admin-only check
    if (options.adminOnly && user.role !== "admin") return null;

    return <WrappedComponent {...props} />;
  };
}

// ─────────────────────────────────────────────────────────────
// 2. useAuthFetch — gọi API có token tự động
// ─────────────────────────────────────────────────────────────
export function useAuthFetch() {
  const { getAccessToken, logout } = useAuth();

  const authFetch = useCallback(async (
    endpoint: string,
    init: RequestInit = {},
  ): Promise<Response> => {
    const token = await getAccessToken();

    if (!token) {
      logout();
      throw new Error("Phiên đăng nhập hết hạn");
    }

    const headers = new Headers(init.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API}${endpoint}`, { ...init, headers });

    // Token hết hạn hoặc bị thu hồi
    if (res.status === 401) {
      logout();
      throw new Error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
    }

    return res;
  }, [getAccessToken, logout]);

  return authFetch;
}

// ─────────────────────────────────────────────────────────────
// 3. UserMenu component
// ─────────────────────────────────────────────────────────────
export function UserMenu() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(200,134,10,0.25)",
          borderRadius: "8px",
          padding: "5px 10px 5px 6px",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        {/* Avatar */}
        <div style={{
          width: "28px", height: "28px", borderRadius: "6px",
          background: isAdmin
            ? "linear-gradient(135deg,#C8860A,#F5D78A)"
            : "linear-gradient(135deg,#1E3A5F,#2D5A8E)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.65rem", fontWeight: 700,
          color: isAdmin ? "#1E3A5F" : "#fff",
          flexShrink: 0,
        }}>
          {initials}
        </div>

        <div style={{ textAlign: "left" }}>
          <div style={{
            fontSize: "0.78rem", fontWeight: 600, color: "#fff",
            lineHeight: 1.2,
          }}>
            {user.username}
          </div>
          <div style={{
            fontSize: "0.6rem", color: "rgba(200,134,10,0.8)",
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            {isAdmin ? "Admin" : "User"}
          </div>
        </div>

        {/* Chevron */}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{
            color: "rgba(255,255,255,0.4)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            marginLeft: "2px",
          }}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" fill="none"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 90,
            }}
          />

          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)",
            width: "200px",
            background: "#fff",
            borderRadius: "10px",
            border: "1.5px solid #D6CFC4",
            boxShadow: "0 8px 32px rgba(30,58,95,0.15)",
            overflow: "hidden",
            zIndex: 100,
            animation: "fadeUp 0.15s ease",
          }}>
            {/* User info */}
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid #EDE8DF",
              background: "#F7F4EF",
            }}>
              <div style={{
                fontSize: "0.68rem", color: "#78716C",
                textTransform: "uppercase", letterSpacing: "0.1em",
                marginBottom: "2px",
              }}>
                Đang đăng nhập
              </div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1C1917" }}>
                {user.username}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#78716C" }}>
                {user.email}
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: "6px" }}>
              <DropdownItem
                icon="🔑"
                label="Đổi mật khẩu"
                onClick={() => { setOpen(false); /* navigate to change-password */ }}
              />
              {isAdmin && (
                <DropdownItem
                  icon="⚙"
                  label="Quản trị hệ thống"
                  onClick={() => { setOpen(false); window.location.href = "/admin"; }}
                />
              )}
              <div style={{ margin: "4px 0", height: "1px", background: "#EDE8DF" }} />
              <DropdownItem
                icon="→"
                label="Đăng xuất"
                danger
                onClick={() => { setOpen(false); logout(); }}
              />
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

function DropdownItem({
  icon, label, onClick, danger = false,
}: {
  icon: string; label: string; onClick: () => void; danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        display: "flex", alignItems: "center", gap: "10px",
        padding: "8px 10px",
        borderRadius: "6px",
        border: "none",
        background: hov
          ? danger ? "#FEF2F2" : "#F7F4EF"
          : "transparent",
        color: danger
          ? hov ? "#9B1C1C" : "#C87070"
          : "#44403C",
        fontSize: "0.82rem",
        fontFamily: "inherit",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.12s",
      }}
    >
      <span style={{ fontSize: "0.88rem", opacity: 0.7 }}>{icon}</span>
      {label}
    </button>
  );
}