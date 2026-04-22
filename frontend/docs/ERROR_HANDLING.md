# Error Handling & Notification System

## Tổng Quan

Hệ thống xử lý lỗi mới được thiết kế để:
- **Ẩn giấu thông tin nhạy cảm** (localhost, port, đường dẫn file, v.v.)
- **Hiển thị thông báo user-friendly** thay vì raw error messages
- **Ghi chi tiết lỗi vào console** (dev only)
- **Sử dụng Toast Notifications** thay vì `alert()`

## Cấu Trúc

### 1. Error Handler (`app/utils/errorHandler.ts`)
Hàm sanitize lỗi và quản lý notifications

```typescript
import { showError, showSuccess, showWarning, showInfo } from "@/app/utils/errorHandler";

// Hiển thị lỗi (sanitize tự động)
showError("Có lỗi xảy ra");

// Hiển thị lỗi mà không sanitize
showError("Thông báo lỗi custom", { sanitize: false });

// Hiển thị thông báo thành công
showSuccess("Thao tác thành công!");

// Hiển thị cảnh báo
showWarning("Cần chú ý điều này");

// Hiển thị thông tin
showInfo("Thông tin hệ thống");
```

### 2. Toast Component (`app/components/Toast.tsx`)
Component hiển thị toast notifications

Tự động ẩn sau 4 giây, có nút close, và animation mượt mà.

### 3. Notification Provider (`app/components/NotificationProvider.tsx`)
Provider cung cấp toast system cho toàn app

Đã được integrate vào root layout.

## Các Pattern Thông Báo Lỗi Bị Ẩn

Hệ thống tự động loại bỏ:

| Pattern | Ví dụ | Mục đích |
|---------|------|---------|
| `localhost:3000` | Ẩn địa chỉ local | Bảo mật |
| `127.0.0.1:8000` | Ẩn IP local | Bảo mật |
| `C:\Users\Admin\...` | Ẩn đường dẫn Windows | Bảo mật |
| `/home/user/...` | Ẩn đường dẫn Linux | Bảo mật |
| `500 Internal Server Error` | Ẩn status code | Thông tin ít |
| `404 Not Found` | Ẩn không tìm thấy | Thông tin ít |
| Ports (`:5000`, `:3306`) | Ẩn port service | Bảo mật |
| Auth tokens, sessions | Ẩn thông tin nhạy cảm | Bảo mật |

## Cách Sử Dụng trong Pages

### Ví dụ 1: Fetch API với xử lý lỗi

```typescript
"use client";
import { showError, showSuccess } from "@/app/utils/errorHandler";

export default function MyPage() {
  const handleFetch = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/data`);
      if (!res.ok) {
        const err = await res.json();
        showError(err.detail); // Tự động sanitize
        return;
      }
      const data = await res.json();
      showSuccess("Lấy dữ liệu thành công!");
    } catch (err) {
      showError(String(err)); // Sanitize error message
      console.error("Full error:", err); // Log chi tiết vào console
    }
  };

  return <button onClick={handleFetch}>Fetch Data</button>;
}
```

### Ví dụ 2: Form submission

```typescript
const handleSubmit = async (formData: FormData) => {
  try {
    const res = await fetch("/api/submit", { method: "POST", body: formData });
    if (!res.ok) {
      showError("Không thể gửi biểu mẫu. Vui lòng thử lại.");
      return;
    }
    showSuccess("Gửi biểu mẫu thành công!");
  } catch (err) {
    showError("Lỗi kết nối. Vui lòng kiểm tra mạng.");
  }
};
```

### Ví dụ 3: File upload

```typescript
const handleUpload = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await fetch("/api/upload", { 
      method: "POST", 
      body: formData 
    });
    
    if (!res.ok) throw new Error("Upload failed");
    showSuccess("Tệp đã tải lên thành công!");
  } catch (err) {
    showError("Không thể tải lên tệp. Vui lòng thử lại.");
    console.error("[UPLOAD]", err);
  }
};
```

## Best Practices

### ✅ Làm

```typescript
// Sử dụng showError cho lỗi từ API/network
showError(apiErrorResponse.message);

// Log chi tiết vào console cho development
console.error("[FEATURE_NAME]", fullError);

// Sử dụng user-friendly messages
showError("Không thể xử lý. Vui lòng thử lại.");

// Hiển thị thành công khi cần
showSuccess("Thao tác hoàn tất!");
```

### ❌ Không làm

```typescript
// ❌ Đừng dùng alert()
alert("Lỗi: " + errorMsg);

// ❌ Đừng hiển thị error thô
showError(fullError.stack);

// ❌ Đừng bỏ qua lỗi
try { /* ... */ } catch (e) {} // Silent fail

// ❌ Đừng leak thông tin nhạy cảm
showError(`Lỗi: ${localStorage.getItem("token")}`);
```

## Console Logs

Để development dễ dàng, hãy sử dụng console logs theo pattern:

```typescript
console.error('[FEATURE_NAME]', error); // Lỗi
console.warn('[FEATURE_NAME]', warning); // Cảnh báo
console.log('[FEATURE_NAME]', info); // Thông tin
console.debug('[FEATURE_NAME]', details); // Chi tiết
```

## Testing

Khi test error handling:

```typescript
// Trigger sanitize
showError("Kết nối tới localhost:3000 thất bại");
// → "Kết nối tới máy chủ thất bại"

// Trigger empty message (fallback)
showError("localhost:8000");
// → "Có lỗi xảy ra. Vui lòng thử lại."

// Custom message (no sanitize)
showError("Thông báo tùy chỉnh", { sanitize: false });
// → "Thông báo tùy chỉnh" (giữ nguyên)
```

## Thay Đổi từ Phiên Bản Cũ

| Cũ | Mới |
|----|----|
| `alert("Error: " + msg)` | `showError(msg)` |
| `alert("Success!")` | `showSuccess("Success!")` |
| Hiển thị error thô | Tự động sanitize |
| Không log console | Log chi tiết vào console |

---

**Tác giả**: System
**Phiên bản**: 1.0
**Cập nhật**: 2024
