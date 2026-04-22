/**
 * Notification Provider - Cung cấp hệ thống thông báo toàn cục
 */

"use client";
import { useToastNotification, ToastContainer } from "./Toast";
import { registerNotificationHandler } from "@/app/utils/errorHandler";
import { useEffect } from "react";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { toasts, addToast, removeToast } = useToastNotification();

  useEffect(() => {
    // Đăng ký handler khi component mount
    registerNotificationHandler((message, type) => {
      addToast(message, type);
    });
  }, [addToast]);

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
