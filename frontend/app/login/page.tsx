"use client";
/**
 * app/login/page.tsx
 * ─────────────────────────────────────────────────────────────
 * Trang đăng nhập — style khớp hoàn toàn với design system
 * (Playfair Display, --primary #1E3A5F, --accent #C8860A)
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth/authContext";

// ─── Tiny Label component (giống encode.tsx) ─────────────────
const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontSize: "0.68rem", fontWeight: 700, color: "#78716C",
    letterSpacing: "0.12em", textTransform: "uppercase",
    marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px",
  }}>
    <div style={{ width: "10px", height: "1.5px", background: "#C8860A" }} />
    {children}
  </div>
);

// ─── Input field ──────────────────────────────────────────────
function Field({
  label, type = "text", value, onChange, placeholder, disabled,
  autoComplete, rightSlot,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  rightSlot?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: rightSlot ? "11px 44px 11px 14px" : "11px 14px",
            borderRadius: "7px",
            border: `1.5px solid ${focused ? "#1E3A5F" : "#D6CFC4"}`,
            background: disabled ? "#F7F4EF" : "#FFFFFF",
            fontSize: "0.9rem",
            color: "#1C1917",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
            boxShadow: focused ? "0 0 0 3px rgba(30,58,95,0.08)" : "none",
          }}
        />
        {rightSlot && (
          <div style={{
            position: "absolute", right: "12px", top: "50%",
            transform: "translateY(-50%)",
          }}>
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Eye icon toggle ──────────────────────────────────────────
function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: "#78716C", padding: "0", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
      tabIndex={-1}
    >
      {show ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      )}
    </button>
  );
}

// ─── Waveform decoration (SVG) ────────────────────────────────
function WaveDecor() {
  return (
    <svg width="100%" height="60" viewBox="0 0 400 60" fill="none"
      preserveAspectRatio="none" style={{ opacity: 0.18 }}>
      <path d="M0 30 Q25 10 50 30 Q75 50 100 30 Q125 10 150 30
               Q175 50 200 30 Q225 10 250 30 Q275 50 300 30
               Q325 10 350 30 Q375 50 400 30"
        stroke="#C8860A" strokeWidth="2" fill="none"/>
      <path d="M0 30 Q25 5 50 30 Q75 55 100 30 Q125 5 150 30
               Q175 55 200 30 Q225 5 250 30 Q275 55 300 30
               Q325 5 350 30 Q375 55 400 30"
        stroke="#C8860A" strokeWidth="1" fill="none" opacity="0.5"/>
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function LoginPage() {
  const { login, loading, error, clearError, user } = useAuth();
  const router = useRouter();

  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [localErr, setLocalErr]   = useState("");
  const usernameRef               = useRef<HTMLInputElement>(null);

  // Nếu đã đăng nhập → redirect
  useEffect(() => {
    if (user) {
      router.push(user.role === "admin" ? "/admin" : "/encode");
    }
  }, [user, router]);

  // Focus username on mount
  useEffect(() => { usernameRef.current?.focus(); }, []);

  // Sync error từ context
  useEffect(() => {
    if (error) { setLocalErr(error); clearError(); }
  }, [error, clearError]);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !loading;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLocalErr("");
    if (!username.trim()) { setLocalErr("Vui lòng nhập tên đăng nhập"); return; }
    if (!password)        { setLocalErr("Vui lòng nhập mật khẩu"); return; }
    await login(username.trim(), password);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Source+Sans+3:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Source Sans 3', sans-serif; }
        :root {
          --primary:    #1E3A5F;
          --accent:     #C8860A;
          --surface:    #FFFFFF;
          --surface-2:  #F7F4EF;
          --text-muted: #78716C;
          --border:     #D6CFC4;
          --error:      #9B1C1C;
          --success:    #1A6B3C;
        }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer  { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes errShake {
          0%,100% { transform:translateX(0); }
          20%,60% { transform:translateX(-6px); }
          40%,80% { transform:translateX(6px); }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#F7F4EF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "440px",
          animation: "fadeUp 0.35s ease both",
        }}>
          {/* Card */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1.5px solid #D6CFC4",
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(30,58,95,0.10), 0 2px 8px rgba(30,58,95,0.06)",
          }}>
            {/* Card header */}
            <div style={{
              background: "linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%)",
              padding: "32px 36px 28px",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Decorative circles */}
              <div style={{
                position: "absolute", right: "-30px", top: "-30px",
                width: "120px", height: "120px", borderRadius: "50%",
                border: "1.5px solid rgba(200,134,10,0.2)",
              }} />
              <div style={{
                position: "absolute", right: "10px", top: "10px",
                width: "60px", height: "60px", borderRadius: "50%",
                border: "1px solid rgba(200,134,10,0.15)",
              }} />

              <div style={{
                fontSize: "0.62rem", color: "rgba(200,134,10,0.85)",
                letterSpacing: "0.2em", textTransform: "uppercase",
                fontWeight: 600, marginBottom: "10px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <span style={{
                  display: "inline-block", width: "20px", height: "1px",
                  background: "rgba(200,134,10,0.6)",
                }} />
                Xác thực danh tính
              </div>

              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.7rem", fontWeight: 700, color: "#fff",
                letterSpacing: "-0.02em", lineHeight: 1.2,
                margin: "0 0 6px",
              }}>
                Đăng nhập hệ thống
              </h1>

              <p style={{
                fontSize: "0.82rem",
                color: "rgba(255,255,255,0.5)",
                margin: 0, lineHeight: 1.5,
              }}>
                Chỉ dành cho người dùng được cấp quyền truy cập
              </p>

              {/* Waveform */}
              <div style={{ marginTop: "16px", marginBottom: "-4px" }}>
                <WaveDecor />
              </div>
            </div>

            {/* Card body */}
            <div style={{ padding: "32px 36px 36px" }} onKeyDown={handleKeyDown}>

                {/* Error banner */}
                {localErr && (
                  <div style={{
                    background: "#FEF2F2", border: "1.5px solid #FCA5A5",
                    borderRadius: "8px", padding: "12px 14px",
                    marginBottom: "20px",
                    display: "flex", alignItems: "flex-start", gap: "10px",
                    animation: "errShake 0.35s ease",
                  }}>
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: "#9B1C1C", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", fontWeight: 700, flexShrink: 0, marginTop: "1px",
                    }}>!</div>
                    <span style={{ fontSize: "0.84rem", color: "#9B1C1C", lineHeight: 1.5 }}>
                      {localErr}
                    </span>
                  </div>
                )}

                {/* Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <Field
                    label="Tên đăng nhập"
                    value={username}
                    onChange={v => { setUsername(v); setLocalErr(""); }}
                    placeholder="Nhập username..."
                    autoComplete="username"
                    disabled={loading}
                  />

                  <Field
                    label="Mật khẩu"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={v => { setPassword(v); setLocalErr(""); }}
                    placeholder="Nhập mật khẩu..."
                    autoComplete="current-password"
                    disabled={loading}
                    rightSlot={
                      <EyeToggle show={showPass} onToggle={() => setShowPass(v => !v)} />
                    }
                  />
                </div>

                {/* Submit button */}
                <button
                  onClick={() => handleSubmit()}
                  disabled={!canSubmit}
                  style={{
                    width: "100%",
                    marginTop: "28px",
                    padding: "13px",
                    borderRadius: "8px",
                    border: "none",
                    background: canSubmit
                      ? "linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%)"
                      : "#E7E5E4",
                    color: canSubmit ? "#fff" : "#A8A29E",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    fontFamily: "inherit",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow: canSubmit
                      ? "0 4px 16px rgba(30,58,95,0.25)"
                      : "none",
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        display: "inline-block",
                        width: "15px", height: "15px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                      }} />
                      Đang xác thực...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Đăng nhập
                    </>
                  )}
                </button>

                {/* Divider info */}
                <div style={{
                  marginTop: "28px",
                  paddingTop: "20px",
                  borderTop: "1px solid #EDE8DF",
                }}>
                  <div style={{
                    background: "#F7F4EF",
                    borderRadius: "8px",
                    border: "1px solid #EDE8DF",
                    padding: "12px 14px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: "5px", height: "5px", borderRadius: "50%",
                      background: "#C8860A", marginTop: "5px", flexShrink: 0,
                      animation: "shimmer 2s ease infinite",
                    }} />
                    <p style={{
                      fontSize: "0.78rem", color: "#78716C",
                      margin: 0, lineHeight: 1.6,
                    }}>
                      Tài khoản được cấp bởi quản trị viên hệ thống.
                      Nếu chưa có tài khoản, vui lòng liên hệ{" "}
                      <span style={{ color: "#C8860A", fontWeight: 600 }}>Admin</span>.
                    </p>
                  </div>
                </div>
            </div>
          </div>

          {/* Footer note */}
          <div style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "0.72rem",
            color: "#A8A29E",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            StegoAudio — Audio Steganography System
          </div>
        </div>
      </div>
    </>
  );
}