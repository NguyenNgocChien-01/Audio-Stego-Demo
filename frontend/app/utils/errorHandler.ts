/**
 * Sanitized Error Handler - Hệ thống xử lý lỗi an toàn
 * Ẩn giấu thông tin nhạy cảm (localhost, port, path, etc)
 */

export type NotificationType = "error" | "success" | "warning" | "info";

interface NotificationCallback {
  (message: string, type: NotificationType): void;
}

let notificationCallback: NotificationCallback | null = null;

/**
 * Đăng ký callback cho thông báo
 * @param callback Hàm xử lý thông báo
 */
export function registerNotificationHandler(callback: NotificationCallback) {
  notificationCallback = callback;
}

/**
 * Sanitize lỗi - Loại bỏ thông tin nhạy cảm
 * @param error Lỗi gốc
 * @returns Thông báo lỗi an toàn
 */
function sanitizeError(error: any): string {
  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (error?.detail) {
    message = error.detail;
  } else if (error?.message) {
    message = error.message;
  } else {
    message = String(error);
  }

  // Loại bỏ thông tin nhạy cảm
  const sensitivePatterns = [
    /localhost(:\d+)?/gi,
    /127\.0\.0\.1(:\d+)?/gi,
    /\d+\.\d+\.\d+\.\d+(:\d+)?/g,
    /:\d{4,5}(?=\D|$)/g, // Ports
    /[a-zA-Z]:\\[^"\\]+/g, // Windows paths
    /\/home\/[^/]+\//g, // Linux paths
    /\/var\/www\//g,
    /api\/[a-z]+/gi,
    /database\|db\|admin/gi,
    /500\s*(?:internal\s*)?server\s*error/gi,
    /404\s*not\s*found/gi,    /400\s*bad\s*request/gi,    /auth|token|cookie|session|password/gi,
  ];

  let sanitized = message;
  sensitivePatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  // Nếu sau khi sanitize quá ngắn, dùng thông báo mặc định
  if (sanitized.trim().length < 5) {
    return "Có lỗi xảy ra. Vui lòng thử lại.";
  }

  // Loại bỏ khoảng trắng thừa
  sanitized = sanitized
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 200); // Giới hạn độ dài

  return sanitized || "Có lỗi xảy ra. Vui lòng thử lại.";
}

/**
 * Hiển thị thông báo lỗi
 * @param message Thông báo
 * @param options Tùy chọn
 */
export function showError(
  message: string,
  options?: { sanitize?: boolean; logConsole?: boolean }
) {
  const { sanitize = true, logConsole = false } = options || {};

  const displayMessage = sanitize ? sanitizeError(message) : message;

  if (notificationCallback) {
    notificationCallback(displayMessage, "error");
  } else {
    // Fallback nếu chưa đăng ký callback
    console.error("[ERROR]", displayMessage);
    if (logConsole) console.error("[RAW]", message);
  }
}

/**
 * Hiển thị thông báo thành công
 */
export function showSuccess(message: string) {
  if (notificationCallback) {
    notificationCallback(message, "success");
  } else {
    console.log("[SUCCESS]", message);
  }
}

/**
 * Hiển thị thông báo cảnh báo
 */
export function showWarning(message: string) {
  if (notificationCallback) {
    notificationCallback(message, "warning");
  } else {
    console.warn("[WARNING]", message);
  }
}

/**
 * Hiển thị thông báo thông tin
 */
export function showInfo(message: string) {
  if (notificationCallback) {
    notificationCallback(message, "info");
  } else {
    console.info("[INFO]", message);
  }
}

/**
 * Xử lý lỗi fetch từ API
 */
export function handleFetchError(error: any, context: string = "API") {
  console.error(`[${context} ERROR]`, error); // Log đầy đủ vào console (dev only)

  if (error instanceof TypeError && error.message.includes("fetch")) {
    showError("Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.");
  } else if (error instanceof Error) {
    showError(error.message);
  } else {
    showError("Có lỗi xảy ra. Vui lòng thử lại.");
  }
}
