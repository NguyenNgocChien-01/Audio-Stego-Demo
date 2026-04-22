/**
 * Toast Notification Component
 * Hiển thị thông báo không xâm phạm dưới dạng toast
 */

"use client";
import { useState, useCallback, useEffect } from "react";
import { registerNotificationHandler, NotificationType } from "@/app/utils/errorHandler";

interface Toast {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
}

const TOAST_DURATION = 4000; // 4 giây

/**
 * Hook để quản lý toast notifications
 */
export function useToastNotification() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: NotificationType) => {
    const id = Date.now().toString();
    const newToast: Toast = {
      id,
      message,
      type,
      timestamp: Date.now(),
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove sau TOAST_DURATION
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

/**
 * Toast Container Component
 */
export function ToastContainer({ toasts, onRemove }: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

/**
 * Single Toast Item
 */
function Toast({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  };

  const getStyles = () => {
    const baseStyle: React.CSSProperties = {
      padding: "14px 18px",
      borderRadius: "8px",
      border: "1.5px solid",
      fontSize: "0.875rem",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      minWidth: "280px",
      maxWidth: "400px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      animation: isExiting
        ? "slideOutRight 0.2s ease forwards"
        : "slideInRight 0.3s ease forwards",
      pointerEvents: "all",
    };

    switch (toast.type) {
      case "error":
        return {
          ...baseStyle,
          borderColor: "#dc2626",
          background: "#fee2e2",
          color: "#991b1b",
        };
      case "success":
        return {
          ...baseStyle,
          borderColor: "#16a34a",
          background: "#f0fdf4",
          color: "#15803d",
        };
      case "warning":
        return {
          ...baseStyle,
          borderColor: "#ea580c",
          background: "#ffedd5",
          color: "#92400e",
        };
      case "info":
        return {
          ...baseStyle,
          borderColor: "#0284c7",
          background: "#f0f9ff",
          color: "#0c4a6e",
        };
      default:
        return baseStyle;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "error":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        );
      case "success":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        );
      case "warning":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.04h16.94a2 2 0 0 0 1.71-3.04l-8.47-14.14a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case "info":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div style={getStyles()}>
      <div style={{ flexShrink: 0, display: "flex" }}>{getIcon()}</div>
      <div style={{ flex: 1, wordBreak: "break-word" }}>{toast.message}</div>
      <button
        onClick={handleClose}
        style={{
          flexShrink: 0,
          background: "transparent",
          border: "none",
          color: "currentColor",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.6,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as any).style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as any).style.opacity = "0.6";
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(384px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(384px);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Setup notification system
 * Gọi hàm này trong root component
 */
export function setupNotificationSystem() {
  registerNotificationHandler((message, type) => {
    // Thêm logic nếu cần
    console.log(`[${type.toUpperCase()}]`, message);
  });
}
