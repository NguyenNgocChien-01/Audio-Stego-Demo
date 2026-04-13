"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// --- DATA ---
const DATA = {
  vi: {
    avatar: "/avt.png", // Đảm bảo bạn có ảnh này trong thư mục public
    ten: "Nguyễn Ngọc Chiến",
    vaiTro: "Data Engineer · Business Analyst · Backend-Developer",
    email: "ngocchiien23l@gmail.com",
    dienThoai: "0399 428 511",
    github: "NguyenNgocChien-01",
    linkedin: "linkedin.com/in/nguyenngocchien",
    diaChi: "Ninh Kiều, Cần Thơ",
    gioiThieu:
      "Sinh viên năm cuối ngành Hệ thống Thông tin tại Trường Đại học Cần Thơ với nền tảng kỹ thuật vững chắc. Có kinh nghiệm làm việc với cơ sở dữ liệu, phát triển ứng dụng web (Back-end) và tích hợp các mô hình Trí tuệ Nhân tạo vào hệ thống thực tế. Khả năng học hỏi nhanh, thích ứng tốt với nhiều vai trò từ Lập trình viên, Kỹ sư Dữ liệu đến Phân tích Nghiệp vụ.",
    hocVan: {
      truong: "Trường Đại học Cần Thơ",
      gpa: "3,58 / 4,0",
      thoiGian: "2022 – 2026",
      khoa: "Khoa Công nghệ Thông tin & Truyền thông",
      nganh: "Hệ thống Thông tin",
      noiBat: [
        "Điểm cao trong các môn Cơ sở dữ liệu, Phân tích Dữ liệu, Hệ thống Thông tin",
        "Top sinh viên xuất sắc ngành Hệ thống Thông tin",
      ],
    },
    kyNang: {
      ngonNgu: ["Python", "PHP", "JavaScript", "C#", "C"],
      framework: ["Django", "FastAPI", "Laravel", "Next.js", "PyTorch", "TensorFlow"],
      duLieu: ["SQL Server", "MySQL", "Oracle", "Power BI", "Phân tích dữ liệu"],
      congCu: ["Git / GitHub", "Docker", "Google Colab", "Kaggle"],
      memDeo: ["Giải quyết vấn đề", "Tư duy phản biện", "Làm việc nhóm", "Nghiên cứu kỹ thuật"],
    },
    thanhTich: [
      { ten: "Học bổng Khuyến khích Học tập ", nam: "HK1 & HK2 năm 2025 – 2026", to_chuc: "Đại học Cần Thơ", loai: "Thành tích" },
      { ten: "Danh hiệu Sinh viên 5 Tốt cấp Trường", nam: "2024 – 2025", to_chuc: "Đại học Cần Thơ", loai: "Thành tích" },
      { ten: "Gemini Certified University Student", nam: "2025", to_chuc: "Google", loai: "Chứng chỉ", link:"https://edu.google.accredible.com/a6983df9-75e3-4d3e-86e9-b5bfaf2d8df4#acc.brGiDthe" },
      { ten: "VSTEP B1", nam: "2024", to_chuc: "Chứng chỉ Ngoại ngữ", loai: "Chứng chỉ" },
    ],
    duAn: [
      {
        ten: "Nghiên cứu Kỹ thuật Giấu tin trong Âm thanh",
        thoiGian: "Tháng 9/2025 – Tháng 4/2026",
        vaiTro: "Khóa luận tốt nghiệp",
        stack: ["Python", "FastAPI", "TensorFlow", "Next.js", "Docker"],
        trangThai: "Đang thực hiện",
        github: "NguyenNgocChien-01/Audio-Stego-Demo",
        moTa: [
          "Đề xuất thuật toán Improved LSB: Sử dụng khóa bí mật kết hợp Salt từ nội dung âm thanh để ngẫu nhiên hóa vị trí nhúng, phá vỡ dấu vết thống kê tuần tự.",
          "Phân tích chất lượng âm thanh qua độ đo MSE, PSNR (>80dB), SNR. Đánh giá bảo mật bằng cách huấn luyện mô hình CNN thám mã.",
          "Xây dựng hệ thống Web hoàn chỉnh hỗ trợ nhúng và trích xuất dữ liệu bí mật từ tệp âm thanh WAV.",
        ],
      },
      {
        ten: "Hệ thống Trích xuất Thông tin Hóa đơn",
        thoiGian: "Tháng 5 – Tháng 8/2025",
        vaiTro: "Kỹ sư AI & Trưởng nhóm",
        stack: ["PyTorch", "GCN", "OCR", "Django", "SQLite"],
        trangThai: "Hoàn thành",
        github: "NguyenNgocChien-01/WebNVTM",
        moTa: [
          "Xây dựng pipeline: Tiền xử lý ảnh → OCR (Tesseract) → Biểu diễn hóa đơn dạng đồ thị (Graph) để khai thác không gian và ngữ nghĩa.",
          "Huấn luyện mô hình Graph Convolutional Network (GCN) trên tập SROIE 2019 kết hợp luật hậu xử lý. Đạt Accuracy 90% trên tập kiểm thử.",
          "Triển khai ứng dụng Web Django cho phép tải ảnh và nhận kết quả trích xuất trực quan.",
        ],
      },
      {
        ten: "Website Thương mại điện tử Thiết bị Công nghệ",
        thoiGian: "Tháng 1 – Tháng 4/2025",
        vaiTro: "Lập trình viên Full-stack",
        stack: ["Laravel", "MySQL", "HTML/CSS/JS", "Git"],
        trangThai: "Hoàn thành",
        github: "Huong-Truong/UniTechShop",
        moTa: [
          "Thiết kế CSDL hơn 20 thực thể. Viết truy vấn tối ưu cho module quản lý kho, nhập hàng, khuyến mãi và báo cáo doanh thu.",
          "Phát triển tính năng lọc sản phẩm thông minh, quản lý giỏ hàng, thanh toán và đánh giá sản phẩm.",
          "Cộng tác quy trình Git, đảm bảo tích hợp liên tục và hệ thống vận hành an toàn với các chuẩn bảo mật.",
        ],
      },
    ],
    soThich: [
      "Nghiên cứu công nghệ mới",
      "Tìm hiểu kiến trúc hệ thống",
      "Đọc tài liệu chuyên ngành",
      "Rèn luyện thể lực",
    ],
    themVeToi: [
      "Sẵn sàng đảm nhiệm: Back-end Developer, Data Engineer, Business Analyst (BA).",
      "Cẩn thận, chịu áp lực tốt, luôn tối ưu hóa mã nguồn và cấu trúc dữ liệu.",
      "Sẵn sàng làm việc toàn thời gian ngay lập tức và có thể di chuyển theo yêu cầu.",
    ],
  },
  en: {
    avatar: "/avt.png",
    ten: "Nguyen Ngoc Chien",
    vaiTro: "Back-end Developer · Data Engineer · Business Analyst · AI/ML Engineer",
    email: "ngocchiien23l@gmail.com",
    dienThoai: "0399 428 511",
    github: "NguyenNgocChien-01",
    linkedin: "linkedin.com/in/nguyenngocchien",
    diaChi: "Ninh Kieu, Can Tho",
    gioiThieu:
      "Final-year Information Systems student at Can Tho University with a solid technical foundation. Experienced in working with databases, developing web applications (Back-end), and integrating Artificial Intelligence models into real-world systems. Fast learner, highly adaptable to various roles from Software Developer, Data Engineer to Business Analyst.",
    hocVan: {
      truong: "Can Tho University",
      gpa: "3.58 / 4.0",
      thoiGian: "2022 – 2026",
      khoa: "College of Information and Communication Technology",
      nganh: "Information Systems",
      noiBat: [
        "High scores in Database, Data Analysis, and Information Systems subjects",
        "Top excellent student in Information Systems",
      ],
    },
    kyNang: {
      ngonNgu: ["Python", "PHP", "JavaScript", "C#", "C"],
      framework: ["Django", "FastAPI", "Laravel", "Next.js", "PyTorch", "TensorFlow"],
      duLieu: ["SQL Server", "MySQL", "Oracle", "Power BI", "Data Analysis"],
      congCu: ["Git / GitHub", "Docker", "Google Colab", "Kaggle"],
      memDeo: ["Problem Solving", "Critical Thinking", "Teamwork", "Tech Research"],
    },
    thanhTich: [
      { ten: "Academic Excellence Scholarship Sem 1 & 2", nam: "2025 – 2026", to_chuc: "Can Tho University", loai: "Award" },
      { ten: "Student of 5 Merits at University Level", nam: "2024 – 2025", to_chuc: "Can Tho University", loai: "Award" },
      { ten: "Gemini Certified University Student", nam: "2025", to_chuc: "Google", loai: "Certificate" },
      { ten: "VSTEP B1", nam: "2024", to_chuc: "Foreign Language Certificate", loai: "Certificate" },
    ],
    duAn: [
      {
        ten: "Research on Audio Steganography Techniques",
        thoiGian: "Sep 2025 – Apr 2026",
        vaiTro: "Graduation Thesis",
        stack: ["Python", "FastAPI", "TensorFlow", "Next.js", "Docker"],
        trangThai: "In Progress",
        github: "NguyenNgocChien-01/Audio-Stego-Demo",
        moTa: [
          "Proposed the Improved LSB algorithm: Using a secret key combined with Salt from audio content to randomize embedding positions, breaking sequential statistical traces.",
          "Analyzed audio quality via MSE, PSNR (>80dB), SNR metrics. Evaluated security by training a CNN steganalysis model.",
          "Built a complete Web system supporting embedding and extracting secret data from WAV audio files.",
        ],
      },
      {
        ten: "Invoice Information Extraction System",
        thoiGian: "May – Aug 2025",
        vaiTro: "AI Engineer & Team Leader",
        stack: ["PyTorch", "GCN", "OCR", "Django", "SQLite"],
        trangThai: "Completed",
        github: "NguyenNgocChien-01/WebNVTM",
        moTa: [
          "Built pipeline: Image Preprocessing → OCR (Tesseract) → Graph-based invoice representation to exploit spatial and semantic features.",
          "Trained a Graph Convolutional Network (GCN) model on the SROIE 2019 dataset combined with post-processing rules. Achieved 90% Accuracy on the test set.",
          "Deployed a Django Web application allowing image uploads and receiving visual extraction results.",
        ],
      },
      {
        ten: "Technology Equipment E-commerce Website",
        thoiGian: "Jan – Apr 2025",
        vaiTro: "Full-stack Developer",
        stack: ["Laravel", "MySQL", "HTML/CSS/JS", "Git"],
        trangThai: "Completed",
        github: "Huong-Truong/UniTechShop",
        moTa: [
          "Designed a database with more than 20 entities. Wrote optimized queries for inventory management, importing, promotions, and revenue reporting modules.",
          "Developed smart product filtering, shopping cart management, payment, and product review features.",
          "Collaborated via Git workflow, ensuring continuous integration and safe system operation following security standards.",
        ],
      },
    ],
    soThich: [
      "Researching new technologies",
      "Learning system architecture",
      "Reading specialized documents",
      "Physical training",
    ],
    themVeToi: [
      "Ready to take on: Back-end Developer, Data Engineer, Business Analyst (BA).",
      "Careful, handle pressure well, always optimize source code and data structures.",
      "Ready to work full-time immediately and flexible to relocate upon request.",
    ],
  },
};

// --- UTILS & COMPONENTS ---
// 6. Fix animation giật khi scroll (Thêm rootMargin)
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e], observer) => {
        if (e.isIntersecting) {
          setV(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -80px 0px" } 
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, v };
}

function Reveal({ children, delay = 0, y = 24 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const { ref, v } = useInView();
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "none" : `translateY(${y}px)`, transition: `opacity .6s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .6s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

function SecHead({ label, th }: { label: string; th: any }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
      <div style={{ width: 3, height: 22, borderRadius: 2, background: "linear-gradient(180deg,#818cf8,#a78bfa)" }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" as const, color: th.textSec }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(99,102,241,.4),transparent)" }} />
    </div>
  );
}

function getTheme(dark: boolean) {
  return dark
    ? {
        bg: "#060d1f",
        textPri: "#e2e8f0",
        textSec: "#94a3b8",
        textMut: "#64748b",
        glassBg: "rgba(15,23,42,0.6)",
        glassBgH: "rgba(15,23,42,0.92)",
        border: "rgba(99,102,241,0.18)",
        tagBg: "rgba(255,255,255,0.05)",
      }
    : {
        bg: "#f8fafc",
        textPri: "#0f172a",
        textSec: "#475569",
        textMut: "#64748b",
        glassBg: "rgba(255,255,255,0.7)",
        glassBgH: "rgba(255,255,255,1)",
        border: "rgba(99,102,241,0.25)",
        tagBg: "rgba(99,102,241,0.08)",
      };
}

// 5. Fix bug hover Tag khi dark mode
function Tag({ label, accent = false, th, theme }: { label: string; accent?: boolean; th: any; theme: string }) {
  const [h, setH] = useState(false);
  return (
    <span
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontSize: 12,
        padding: "4px 12px",
        borderRadius: 6,
        fontWeight: accent ? 600 : 400,
        background: h ? "rgba(99,102,241,0.25)" : accent ? "rgba(99,102,241,0.15)" : th.tagBg,
        color: h ? "#c7d2fe" : accent ? (theme === "dark" ? "#a5b4fc" : "#4338ca") : th.textSec,
        border: `1px solid ${h ? "rgba(99,102,241,0.5)" : accent ? "rgba(99,102,241,0.25)" : th.border}`,
        transition: "all .2s ease",
        cursor: "default",
      }}
    >
      {label}
    </span>
  );
}

// 7. Fix minor UX (cursor pointer/inherit) & Missing Components
function ContactChip({ icon, label, href, onClick, th }: any) {
  const [h, setH] = useState(false);
  const isAction = href || onClick;
  const content = (
    <div
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "8px 14px", borderRadius: 8,
        background: h ? th.glassBgH : th.glassBg, border: `1px solid ${th.border}`,
        color: th.textPri, fontSize: 13, fontWeight: 500,
        cursor: isAction ? "pointer" : "inherit",
        transition: "all 0.2s"
      }}
    >
      <span style={{ color: th.textSec, fontWeight: "bold" }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>{content}</a> : content;
}

function HighlightCard({ icon, tieu, mo, c, delay, th }: any) {
  return (
    <Reveal delay={delay}>
      <div style={{ background: th.glassBg, borderTop: `2px solid ${c}`, borderRight: `1px solid ${th.border}`, borderBottom: `1px solid ${th.border}`, borderLeft: `1px solid ${th.border}`, borderRadius: 16, padding: "24px", height: "100%" }}>
        <div style={{ fontSize: 28, marginBottom: 16 }}>{icon}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: th.textPri, marginBottom: 8 }}>{tieu}</div>
        <div style={{ fontSize: 13, color: th.textSec, lineHeight: 1.6 }}>{mo}</div>
      </div>
    </Reveal>
  );
}
function AwardCard({ tt, delay, th }: any) {
  // Nội dung bên trong thẻ (Tên chứng chỉ, tổ chức, năm)
  const content = (
    <div style={{ background: th.glassBg, border: `1px solid ${th.border}`, borderRadius: 16, padding: "20px", height: "100%", transition: "all 0.2s" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: th.textPri, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{tt.ten}</span>
        {/* Hiển thị icon mũi tên nhỏ nếu có link */}
        {tt.link && <span style={{ fontSize: 16, color: th.textSec }}>↗</span>}
      </div>
      <div style={{ fontSize: 12, color: th.textMut }}>{tt.to_chuc} · {tt.nam}</div>
    </div>
  );

  return (
    <Reveal delay={delay}>
      {tt.link ? (
        <a 
          href={tt.link} 
          target="_blank" 
          rel="noreferrer" 
          style={{ textDecoration: "none", display: "block", height: "100%" }}
          onMouseEnter={(e) => (e.currentTarget.firstChild as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
          onMouseLeave={(e) => (e.currentTarget.firstChild as HTMLElement).style.borderColor = th.border}
        >
          {content}
        </a>
      ) : (
        content
      )}
    </Reveal>
  );
}
function ProjectCard({ p, open, onToggle, accent, delay, th, labelTexts }: any) {
  return (
    <Reveal delay={delay}>
      <div style={{ background: th.glassBg, borderTop: `1px solid ${th.border}`, borderRight: `1px solid ${th.border}`, borderBottom: `1px solid ${th.border}`, borderLeft: `3px solid ${accent}`, borderRadius: 16, overflow: "hidden" }}>
        <div onClick={onToggle} style={{ padding: "24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: th.textPri, marginBottom: 6 }}>{p.ten}</div>
            <div style={{ fontSize: 13, color: th.textMut }}>{p.vaiTro} · {p.thoiGian}</div>
          </div>
          <div style={{ fontSize: 20, color: th.textSec }}>{open ? "−" : "+"}</div>
        </div>
        {open && (
          <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${th.border}` }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }}>
              {p.stack.map((s: string, i: number) => <span key={i} style={{ fontSize: 11, background: th.tagBg, color: th.textSec, padding: "4px 10px", borderRadius: 4 }}>{s}</span>)}
            </div>
            <ul style={{ paddingLeft: 18, color: th.textSec, fontSize: 14, lineHeight: 1.7 }}>
              {p.moTa.map((m: string, i: number) => <li key={i}>{m}</li>)}
            </ul>
            <a href={`https://github.com/${p.github}`} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: accent, textDecoration: "none", fontWeight: 600 }}>{labelTexts.sourceCode} ↗</a>
          </div>
        )}
      </div>
    </Reveal>
  );
}

// --- MAIN PAGE ---
export default function Portfolio() {
  const [duAnMo, setDuAnMo] = useState<number | null>(null);
  const [daSao, setDaSao] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [lang, setLang] = useState<"vi" | "en">("en");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const projectColors = ["#6366f1", "#8b5cf6", "#06b6d4"];

  const th = getTheme(theme === "dark");
  const hs = DATA[lang];

  // Scroll to top effect
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 3. Fix copy email (Xử lý bất đồng bộ try/catch)
  const saoEmail = async () => {
    try {
      await navigator.clipboard.writeText(hs.email);
      setDaSao(true);
      setTimeout(() => setDaSao(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const labelTexts = {
    badge: lang === "vi" ? "SẴN SÀNG NHẬN VIỆC · IT 2026" : "READY TO WORK · IT 2026",
    employer: lang === "vi" ? "Thông tin dành cho nhà tuyển dụng" : "Employer information",
    highlights: lang === "vi" ? "Điểm nổi bật cho nhà tuyển dụng" : "Highlights for recruiters",
    skills: lang === "vi" ? "Năng lực chuyên môn" : "Skills",
    education: lang === "vi" ? "Học vấn" : "Education",
    achievements: lang === "vi" ? "Thành tích & Chứng chỉ" : "Achievements & certificates",
    extras: lang === "vi" ? "Thông tin bổ sung" : "Additional info",
    interests: lang === "vi" ? "Sở thích" : "Interests",
    commitments: lang === "vi" ? "Định hướng & Cam kết" : "Direction & commitment",
    copied: lang === "vi" ? "Đã sao chép!" : "Copied!",
    sourceCode: lang === "vi" ? "Xem source code trên GitHub" : "View source code on GitHub",
  };

  return (
    <div style={{ background: th.bg, minHeight: "100vh", color: th.textPri, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", overflowX: "hidden", transition: "background 0.3s ease, color 0.3s ease" }} suppressHydrationWarning>
      
      {/* 2. Fix responsive grid (Bơm CSS Classes thẳng vào component) */}
      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; padding: 24px 32px; }
        .ntd-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px 28px; }
        .highlight-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .skill-grid, .award-grid, .extra-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .avatar-image { object-fit: cover; border-radius: 17px; display: block; width: 100%; height: auto; }
        
        @media (max-width: 768px) {
          .stats-grid, .highlight-grid, .skill-grid, .award-grid, .extra-grid { grid-template-columns: 1fr; }
          .stats-grid > div { border-right: none !important; padding: 16px 0; }
          .stats-grid > div:last-child { border-bottom: none; }
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", animation: "aurora1 12s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", animation: "aurora2 15s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", top: "40%", right: "20%", width: "30vw", height: "30vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)", animation: "aurora1 18s ease-in-out infinite alternate-reverse" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(99,102,241,0.15) 1px, transparent 1px)", backgroundSize: "32px 32px", opacity: 0.5 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── HERO ── */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "80px 28px 60px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12, marginLeft: "auto", width: "100%", justifyContent: "flex-end" }}>
              <button onClick={() => setLang(lang === "vi" ? "en" : "vi")} style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid rgba(99,102,241,0.25)", background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)", color: th.textPri, cursor: "pointer", transition: "all 0.2s" }}>{lang === "vi" ? "EN" : "VI"}</button>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid rgba(99,102,241,0.25)", background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)", color: th.textPri, cursor: "pointer", transition: "all 0.2s" }}>{theme === "dark" ? "Light" : "Dark"}</button>
            </div>

            <div style={{ flex: 1, minWidth: 300 }}>
              <Reveal>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)", marginBottom: 22 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "block", boxShadow: "0 0 8px #10b981" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", color: "#6ee7b7" }}>{labelTexts.badge}</span>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.2rem)", fontWeight: 800, lineHeight: 1.05, margin: "0 0 12px", letterSpacing: "-.02em" }}>
                  {/* 1. Fix lỗi tên bị đen khi đổi theme */}
                  <span style={{ backgroundImage: theme === "dark" ? "linear-gradient(135deg,#f8fafc,#cbd5e1)" : "linear-gradient(135deg,#0f172a,#334155)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>
                    {hs.ten}
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={140}>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, backgroundImage: theme === "dark" ? "linear-gradient(90deg,#818cf8,#a78bfa)" : "linear-gradient(90deg,#4f46e5,#7c3aed)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", lineHeight: 1.6 }}>
                    {hs.vaiTro}
                  </span>
                </div>
              </Reveal>

              <Reveal delay={180}>
                <p style={{ fontSize: 15, color: th.textSec, lineHeight: 1.75, maxWidth: 520, marginBottom: 28 }}>{hs.gioiThieu}</p>
              </Reveal>

              <Reveal delay={240}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    { icon: "✉", label: daSao ? labelTexts.copied : hs.email, fn: saoEmail },
                    { icon: "☎", label: hs.dienThoai },
                    { icon: "GH", label: "GitHub", href: `https://github.com/${hs.github}` },
                    { icon: "IN", label: "LinkedIn", href: `https://${hs.linkedin}` },
                  ].map((c, i) => (
                    <ContactChip key={i} icon={c.icon} label={c.label} href={c.href} onClick={c.fn} th={th} />
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={100} y={16}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", inset: -8, borderRadius: 24, background: "linear-gradient(135deg,rgba(99,102,241,0.5),rgba(139,92,246,0.4),rgba(6,182,212,0.3))", filter: "blur(16px)", zIndex: 0 }} />
                <div style={{ position: "relative", zIndex: 1, padding: 3, borderRadius: 20, background: "linear-gradient(135deg,rgba(99,102,241,0.8),rgba(139,92,246,0.7))", overflow: "hidden" }}>
                  {/* 9. Tối ưu ảnh bằng next/image */}
                  <Image 
                    src={hs.avatar} 
                    alt={hs.ten} 
                    width={168} 
                    height={168} 
                    priority
                    className="avatar-image"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 28px 100px" }}>
          {/* ── HỌC VẤN ── */}
          <Reveal>
            <div style={{ marginBottom: 56 }}>
              <SecHead label={labelTexts.education} th={th} />
              <div style={{ background: th.glassBg, borderTop: `1px solid ${th.border}`, borderRight: `1px solid ${th.border}`, borderBottom: `1px solid ${th.border}`, borderLeft: "3px solid #8b5cf6", borderRadius: 16, backdropFilter: "blur(12px)", padding: "28px 32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: th.textPri, marginBottom: 5 }}>{hs.hocVan.truong}</div>
                    <div style={{ fontSize: 13, color: th.textMut }}>{hs.hocVan.nganh} · {hs.hocVan.khoa}</div>
                    <div style={{ fontSize: 13, color: th.textMut }}>{hs.hocVan.thoiGian}</div>
                  </div>
                  <div style={{ background: theme === "dark" ? "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))" : "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.05))", border: `1px solid ${th.border}`, borderRadius: 12, padding: "10px 20px", alignSelf: "flex-start" }}>
                    <div style={{ fontSize: 10, color: theme === "dark" ? "#818cf8" : "#4f46e5", fontWeight: 700, letterSpacing: ".08em", marginBottom: 2 }}>GPA</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: theme === "dark" ? "#c7d2fe" : "#312e81" }}>{hs.hocVan.gpa}</div>
                  </div>
                </div>
                <ul style={{ paddingLeft: 20, margin: 0, color: th.textSec, fontSize: 14, lineHeight: 1.8 }}>
                  {hs.hocVan.noiBat.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </div>
            </div>
          </Reveal>

          {/* ── NTD INFO ── */}
          <Reveal>
            <div style={{ background: th.glassBg, borderTop: `1px solid ${th.border}`, borderRight: `1px solid ${th.border}`, borderBottom: `1px solid ${th.border}`, borderLeft: "3px solid #6366f1", borderRadius: 16, backdropFilter: "blur(12px)", padding: "28px 32px", marginBottom: 56 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: "#6366f1", textTransform: "uppercase", marginBottom: 18 }}>{labelTexts.employer}</div>
              <div className="ntd-grid">
                {[
                  { nhan: lang === "vi" ? "Vị trí ứng tuyển" : "Position", gt: "Back-end / Data Engineer / BA" },
                  { nhan: lang === "vi" ? "Thời gian bắt đầu" : "Start Time", gt: lang === "vi" ? "Ngay lập tức (full-time)" : "Immediately (full-time)" },
                  { nhan: lang === "vi" ? "Khả năng di chuyển" : "Relocation", gt: lang === "vi" ? "Linh hoạt theo yêu cầu" : "Flexible on request" },
                  { nhan: "GPA / Xếp loại", gt: lang === "vi" ? "3,58 / 4,0 · Xuất sắc" : "3.58 / 4.0 · Excellent" },
                  { nhan: lang === "vi" ? "Ngoại ngữ" : "Language", gt: lang === "vi" ? "Tiếng Anh VSTEP B1" : "English VSTEP B1" },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 11, color: th.textSec, marginBottom: 4, fontWeight: 500 }}>{item.nhan}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: th.textPri }}>{item.gt}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── HIGHLIGHTS ── */}
          <Reveal>
            <div style={{ marginBottom: 56 }}>
              <SecHead label={labelTexts.highlights} th={th} />
              <div className="highlight-grid">
                {[
                  { icon: "🤖", tieu: lang === "vi" ? "AI & ML thực chiến" : "AI & ML Practical", mo: lang === "vi" ? "Tích hợp GCN, CNN, TensorFlow vào hệ thống thực tế." : "Integrated GCN, CNN, TensorFlow into real systems.", c: "#6366f1" },
                  { icon: "⚡", tieu: "Full-stack & Back-end", mo: lang === "vi" ? "Từng sử dụng FastAPI, Laravel, Next.js. Thiết kế CSDL 20+ thực thể, tối ưu truy vấn." : "Used FastAPI, Laravel, Next.js. Designed DB with 20+ entities, query optimization.", c: "#8b5cf6" },
                  { icon: "🔬", tieu: lang === "vi" ? "Nghiên cứu độc lập" : "Independent Research", mo: lang === "vi" ? "Khóa luận đề xuất thuật toán cải tiến Improved LSB với bảo mật thống kê cho giấu tin âm thanh." : "Thesis proposing Improved LSB algorithm with statistical security for audio steganography.", c: "#06b6d4" },
                ].map((nd, i) => (
                  <HighlightCard key={i} {...nd} delay={i * 80} th={th} />
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── KỸ NĂNG ── */}
          <Reveal>
            <div style={{ marginBottom: 56 }}>
              <SecHead label={labelTexts.skills} th={th} />
              <div className="skill-grid">
                {[
                  { tieu: lang === "vi" ? "Ngôn ngữ lập trình" : "Programming Languages", ds: hs.kyNang.ngonNgu, accent: true, c: "#6366f1" },
                  { tieu: lang === "vi" ? "Framework & Thư viện" : "Frameworks & Libraries", ds: hs.kyNang.framework, accent: false, c: "#8b5cf6" },
                  { tieu: lang === "vi" ? "Dữ liệu & Phân tích" : "Data & Analytics", ds: hs.kyNang.duLieu, accent: false, c: "#06b6d4" },
                  { tieu: lang === "vi" ? "Công cụ & Kỹ năng mềm" : "Tools & Soft Skills", ds: [...hs.kyNang.congCu, ...hs.kyNang.memDeo], accent: false, c: "#10b981" },
                ].map((g, gi) => (
                  <div key={gi} style={{ background: th.glassBg, borderRight: `1px solid ${th.border}`, borderBottom: `1px solid ${th.border}`, borderLeft: `1px solid ${th.border}`, borderTop: `2px solid ${g.c}`, borderRadius: 16, backdropFilter: "blur(12px)", padding: "22px 24px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: th.textPri, marginBottom: 14, letterSpacing: ".03em" }}>{g.tieu}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {g.ds.map((it, ii) => (
                        <Tag key={ii} label={it} accent={g.accent} th={th} theme={theme} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── DỰ ÁN ── */}
          <Reveal>
            <div style={{ marginBottom: 56 }}>
              <SecHead label={lang === "vi" ? "Dự án tiêu biểu" : "Featured Projects"} th={th} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {hs.duAn.map((p, i) => (
                  <ProjectCard key={i} p={p} open={duAnMo === i} onToggle={() => setDuAnMo(duAnMo === i ? null : i)} accent={projectColors[i]} delay={i * 60} th={th} labelTexts={labelTexts} />
                ))}
              </div>
            </div>
          </Reveal>


          {/* ── THÀNH TÍCH ── */}
          <Reveal>
            <div style={{ marginBottom: 56 }}>
              <SecHead label={labelTexts.achievements} th={th} />
              <div className="award-grid">
                {hs.thanhTich.map((tt, i) => (
                  <AwardCard key={i} tt={tt} delay={i * 60} th={th} />
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── BỔ SUNG ── */}
          <Reveal>
            <div>
              <SecHead label={labelTexts.extras} th={th} />
              <div className="extra-grid">
                <div style={{ background: th.glassBg, border: `1px solid ${th.border}`, borderRadius: 16, backdropFilter: "blur(12px)", padding: "22px 24px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: th.textPri, marginBottom: 12, letterSpacing: ".04em" }}>{labelTexts.interests}</div>
                  <ul style={{ paddingLeft: 18, margin: 0, color: th.textMut, fontSize: 14, lineHeight: 1.85 }}>
                    {hs.soThich.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div style={{ background: th.glassBg, border: `1px solid ${th.border}`, borderRadius: 16, backdropFilter: "blur(12px)", padding: "22px 24px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: th.textPri, marginBottom: 12, letterSpacing: ".04em" }}>{labelTexts.commitments}</div>
                  <ul style={{ paddingLeft: 18, margin: 0, color: th.textMut, fontSize: 14, lineHeight: 1.85 }}>
                    {hs.themVeToi.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── SCROLL TO TOP ── */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            style={{
              position: "fixed",
              bottom: 28,
              right: 28,
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: `1px solid ${th.border}`,
              background: th.glassBg,
              backdropFilter: "blur(12px)",
              color: th.textPri,
              fontSize: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = th.glassBgH;
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = th.glassBg;
              e.currentTarget.style.borderColor = th.border;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}