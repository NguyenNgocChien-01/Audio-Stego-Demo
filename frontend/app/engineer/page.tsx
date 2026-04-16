"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// --- DATA ---
const DATA = {
  vi: {
    avatar: "/avt.png",
    ten: "Nguyễn Ngọc Chiến",
    vaiTro: "Thực tập sinh Kỹ thuật",
    ngaySinh: "02/01/2004",
    email: "ngocchiien23@gmail.com",
    dienThoai: "0399 428 511",
    chieuCao: "1.74m",
    facebook: "www.facebook.com/chiienn02/",
    diaChi: "An Thới, Phú Quốc",
    gioiThieu:
      "Sinh viên năm cuối ngành Hệ thống Thông tin tại Trường Đại học Cần Thơ, dự kiến tốt nghiệp tháng 10/2026. Có kiến thức nền tảng về điện dân dụng từ bậc THCS và kinh nghiệm thực tế kéo cáp điện trong môi trường công trình. Từng làm việc tại Premier Village Phu Quoc Resort — hiểu quy trình vận hành và tiêu chuẩn dịch vụ khách sạn 5 sao. Chăm chỉ, cẩn thận, sẵn sàng làm việc theo ca và học hỏi kỹ năng kỹ thuật mới.",
    hocVan: {
      truong: "Đại học Cần Thơ",
      gpa: "3,58 / 4,0",
      thoiGian: "2022 – 2026",
      khoa: "Trường Công nghệ Thông tin & Truyền thông",
      nganh: "Hệ thống Thông tin",
      noiBat: [
        "Học bổng Khuyến khích Học tập HK1 & HK2 năm 2025 – 2026",
        "Danh hiệu Sinh viên 5 Tốt cấp Trường CNTT và TT năm 2024 – 2025",
      ],
    },
    kyNang: {
      dienDanDung: ["Nối mạch điện cơ bản", "Lắp công tắc & ổ cắm", "Đọc sơ đồ điện", "Đấu nối dây an toàn"],
      thiCong: ["Kéo cáp điện", "Kéo cáp mạng", "Làm việc trong công trình"],
      khachSan: ["Vận hành khu giải trí", "Vệ sinh & bảo dưỡng hồ bơi", "Setup sự kiện", "Tiêu chuẩn dịch vụ 5 sao"],
      mem: ["Cẩn thận & tỉ mỉ", "Làm việc theo ca", "Chịu áp lực tốt", "Tinh thần trách nhiệm cao"],
    },
    thanhTich: [
      { ten: "Học bổng Khuyến khích Học tập", nam: "HK1 & HK2 năm 2025 – 2026", to_chuc: "Đại học Cần Thơ", loai: "Thành tích", bgLight: "#e0e7ff", bgDark: "#3730a3" },
      { ten: "Danh hiệu Sinh viên 5 Tốt cấp Trường CNTT và TT", nam: "2024 – 2025", to_chuc: "Đại học Cần Thơ", loai: "Thành tích", bgLight: "#dcfce7", bgDark: "#166534" },
      { ten: "VSTEP B1", nam: "2024", to_chuc: "Chứng chỉ Ngoại ngữ", loai: "Chứng chỉ", bgLight: "#ffedd5", bgDark: "#9a3412" },
    ],
    duAn: [
      {
        ten: "Nhân viên Casual Giải Trí – Premier Village Phu Quoc Resort",
        thoiGian: "2 tháng (2022)",
        vaiTro: "Nhân viên Casual",
        stack: ["Vận hành khu giải trí", "Vệ sinh hồ bơi", "Setup sự kiện", "Tiêu chuẩn 5 sao"],
        trangThai: "Hoàn thành",
        github: "",
        bgLight: "#e0f2fe", bgDark: "#075985",
        tag: "#0ea5e9",
        moTa: [
          "Vận hành và hỗ trợ các hoạt động tại khu vui chơi giải trí của resort.",
          "Vệ sinh và bảo dưỡng hồ bơi, đảm bảo tiêu chuẩn vệ sinh cho khách.",
          "Dọn dẹp, sắp xếp và setup không gian phục vụ sự kiện theo yêu cầu.",
          "Làm quen với môi trường làm việc khách sạn chuyên nghiệp, hiểu quy trình vận hành thực tế.",
        ],
      },
      {
        ten: "Công nhân Kéo Cáp – Van Khanh Group",
        thoiGian: "2 tháng (2021)",
        vaiTro: "Công nhân Công nhật",
        stack: ["Kéo cáp điện", "Kéo cáp mạng", "An toàn lao động", "Làm việc theo ca"],
        trangThai: "Hoàn thành",
        github: "",
        bgLight: "#fce7f3", bgDark: "#831843",
        tag: "#ec4899",
        moTa: [
          "Tham gia kéo cáp điện và cáp mạng trong môi trường công trình thực tế.",
          "Rèn luyện tác phong làm việc kỷ luật, cẩn thận và tuân thủ quy trình an toàn lao động.",
          "Quen với môi trường làm việc theo giờ ca, chịu được áp lực công việc tay chân.",
        ],
      },
      {
        ten: "Kiến thức Điện Dân Dụng – THCS",
        thoiGian: "Bậc THCS",
        vaiTro: "Thực hành",
        stack: ["Nối mạch điện", "Lắp công tắc", "Đọc sơ đồ điện", "Đấu nối an toàn"],
        trangThai: "Hoàn thành",
        github: "",
        bgLight: "#fef9c3", bgDark: "#713f12",
        tag: "#eab308",
        moTa: [
          "Thực hành nối mạch điện cơ bản, lắp công tắc, ổ cắm và đọc sơ đồ điện.",
          "Nắm vững nguyên tắc đấu nối dây điện an toàn, đảm bảo không xảy ra sự cố điện.",
        ],
      },
    ],
    soThich: [
      "Tìm hiểu kỹ thuật điện – cơ",
      "Rèn luyện thể lực",
      "Khám phá môi trường làm việc mới",
      "Học hỏi qua thực hành",
    ],
    themVeToi: [
      "Sẵn sàng đảm nhiệm vị trí Thực tập sinh Kỹ thuật tại khách sạn / resort.",
      "Cẩn thận, chịu áp lực tốt, có tinh thần trách nhiệm cao với công việc được giao.",
      "Sẵn sàng làm việc theo ca (ca đêm, cuối tuần, ngày lễ). Đã sinh sống tại Phú Quốc.",
    ],
  },
  en: {
    avatar: "/avt.png",
    ten: "Nguyen Ngoc Chien",
    vaiTro: "Engineering Intern ",
    ngaySinh: "02/01/2004",
    email: "ngocchiien23@gmail.com",
    dienThoai: "0399 428 511",
    chieuCao: "1.74m",
    facebook: "www.facebook.com/chiienn02/",
    diaChi: "An Thoi, Phu Quoc",
    gioiThieu:
      "Final-year Information Systems student at Can Tho University, expected to graduate in October 2026. Has foundational knowledge in residential electrical systems from secondary school and hands-on experience in cable pulling on construction sites. Previously worked at Premier Village Phu Quoc Resort — familiar with 5-star hotel operations and service standards. Hardworking, detail-oriented, available for shift work, and eager to learn new technical skills.",
    hocVan: {
      truong: "Can Tho University",
      gpa: "3.58 / 4.0",
      thoiGian: "2022 – 2026",
      khoa: "College of Information and Communication Technology",
      nganh: "Information Systems",
      noiBat: [
        "Academic Excellence Scholarship – Sem 1 & 2, 2025–2026",
        "University-level Student of 5 Merits, School of ICT, 2024–2025",
      ],
    },
    kyNang: {
      dienDanDung: ["Basic wiring", "Switch & outlet installation", "Reading electrical diagrams", "Safe wire connection"],
      thiCong: ["Electrical cable pulling", "Network cable pulling", "On-site construction work"],
      khachSan: ["Recreation area operations", "Pool cleaning & maintenance", "Event setup", "5-star service standards"],
      mem: ["Detail-oriented", "Shift work availability", "Works well under pressure", "High sense of responsibility"],
    },
    thanhTich: [
      { ten: "Academic Excellence Scholarship Sem 1 & 2", nam: "2025 – 2026", to_chuc: "Can Tho University", loai: "Award", bgLight: "#e0e7ff", bgDark: "#3730a3" },
      { ten: "University-level Student of 5 Merits, School of ICT", nam: "2024 – 2025", to_chuc: "Can Tho University", loai: "Award", bgLight: "#dcfce7", bgDark: "#166534" },
      { ten: "VSTEP B1", nam: "2024", to_chuc: "Foreign Language Certificate", loai: "Certificate", bgLight: "#ffedd5", bgDark: "#9a3412" },
    ],
    duAn: [
      {
        ten: "Casual Recreation Staff – Premier Village Phu Quoc Resort",
        thoiGian: "2 months (2022)",
        vaiTro: "Casual Staff",
        stack: ["Recreation operations", "Pool maintenance", "Event setup", "5-star standards"],
        trangThai: "Completed",
        github: "",
        bgLight: "#e0f2fe", bgDark: "#075985",
        tag: "#0ea5e9",
        moTa: [
          "Operated and supported activities at the resort's recreation and entertainment area.",
          "Cleaned and maintained the swimming pool to ensure hygiene standards for guests.",
          "Set up and arranged spaces for events upon request.",
          "Gained hands-on experience in professional hotel operations and service workflows.",
        ],
      },
      {
        ten: "Cable Puller – Van Khanh Group",
        thoiGian: "2 months (2021)",
        vaiTro: "Daily Worker",
        stack: ["Electrical cable pulling", "Network cable pulling", "Safety compliance", "Shift work"],
        trangThai: "Completed",
        github: "",
        bgLight: "#fce7f3", bgDark: "#831843",
        tag: "#ec4899",
        moTa: [
          "Participated in pulling electrical and network cables in real construction environments.",
          "Developed disciplined work habits and strictly followed occupational safety procedures.",
          "Adapted to shift-based work schedules and physically demanding tasks.",
        ],
      },
      {
        ten: "Residential Electrical Skills – Secondary School",
        thoiGian: "Secondary School",
        vaiTro: "Hands-on Practice",
        stack: ["Basic wiring", "Switch installation", "Reading diagrams", "Safe connection"],
        trangThai: "Completed",
        github: "",
        bgLight: "#fef9c3", bgDark: "#713f12",
        tag: "#eab308",
        moTa: [
          "Practiced basic electrical circuit assembly, switch and outlet installation, and reading electrical diagrams.",
          "Mastered safe wire connection principles to prevent electrical incidents.",
        ],
      },
    ],
    soThich: [
      "Exploring electrical & mechanical systems",
      "Physical training",
      "Discovering new work environments",
      "Learning through hands-on practice",
    ],
    themVeToi: [
      "Ready to take on Engineering Intern role at a hotel or resort.",
      "Detail-oriented, handles pressure well, highly responsible for assigned tasks.",
      "Available for shift work including nights, weekends, and holidays. Currently living in Phu Quoc.",
    ],
  },
};

// --- HOOKS & UTILS ---
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e], observer) => {
        if (e.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -80px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function MagWord({ word, delay, accent = false, isDark }: { word: string; delay: number; accent?: boolean; isDark: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <span
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-block",
        marginRight: "0.28em",
        color: accent ? (isDark ? "#818cf8" : "var(--accent)") : "inherit",
        transform: hov ? "translateY(-6px) scale(1.08)" : "translateY(0) scale(1)",
        transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        cursor: "default",
        animation: `wordDrop 0.5s ease ${delay}s both`,
      }}
    >
      {word}
    </span>
  );
}

const Label = ({ children, isDark }: { children: React.ReactNode; isDark: boolean }) => (
  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: isDark ? "#94a3b8" : "#475569", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
    <div style={{ width: "16px", height: "3px", background: isDark ? "#fff" : "#000", flexShrink: 0 }} />
    {children}
  </div>
);

const BARS = [4, 7, 14, 20, 13, 18, 24, 16, 10, 22, 15, 8, 19, 12, 6, 17, 11, 23, 9, 16, 13, 7, 20, 14, 5];

// --- MAIN COMPONENT ---
export default function Portfolio() {
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [daSao, setDaSao] = useState(false);
  const [duAnMo, setDuAnMo] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const hs = DATA[lang];
  const isDark = theme === "dark";
  const nameWords = hs.ten.split(" ");

  const t = {
    bg: isDark ? "#0f172a" : "#f8fafc",
    textPri: isDark ? "#f8fafc" : "#000",
    textSec: isDark ? "#cbd5e1" : "#334155",
    textMut: isDark ? "#94a3b8" : "#475569",
    cardBg: isDark ? "#1e293b" : "#fff",
    border: isDark ? "#fff" : "#000",
    shadow: isDark ? "#cbd5e1" : "#000",
    heroBg: isDark ? "#020617" : "#fef8f1",
  };

  useEffect(() => {
    document.title = `${hs.ten} - Portfolio`;
  }, [lang, hs.ten]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const saoEmail = async () => {
    try {
      await navigator.clipboard.writeText(hs.email);
      setDaSao(true);
      setTimeout(() => setDaSao(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const labels = {
    badge: lang === "vi" ? "SẴN SÀNG NHẬN VIỆC · KỸ THUẬT KHÁCH SẠN 2026" : "READY TO WORK · HOTEL ENGINEERING 2026",
    employer: lang === "vi" ? "Thông tin ứng viên" : "Candidate Info",
    skills: lang === "vi" ? "Kỹ năng chuyên môn" : "Technical Skills",
    experience: lang === "vi" ? "Kinh nghiệm thực tế" : "Work Experience",
    education: lang === "vi" ? "Học vấn" : "Education",
    achievements: lang === "vi" ? "Thành tích" : "Achievements",
    extras: lang === "vi" ? "Bổ sung" : "Extras",
    commitments: lang === "vi" ? "Định hướng" : "Commitments",
    interests: lang === "vi" ? "Sở thích" : "Interests",
    copied: lang === "vi" ? "Đã sao chép!" : "Copied!",
  };

  return (
    <div style={{ background: t.bg, minHeight: "100vh", color: t.textPri, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", overflowX: "hidden", transition: "background 0.3s ease, color 0.3s ease" }} suppressHydrationWarning>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        :root { --accent: #4f46e5; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${t.bg}; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        @keyframes wordDrop { from { opacity:0; transform:translateY(-14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes badgePop { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        @keyframes barPulse { from { transform:scaleY(0.5); opacity:0.3; } to { transform:scaleY(1.5); opacity:0.8; } }
        .hover-card { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-card:hover { transform: translateY(-3px); box-shadow: 5px 5px 0 ${t.shadow} !important; }
        .pill-btn {
          font-size: 0.8rem; font-weight: 700; color: ${t.textPri}; text-decoration: none;
          padding: 8px 18px; border-radius: 20px; border: 2px solid ${t.border};
          background: ${t.cardBg}; display: inline-flex; align-items: center; gap: 6px;
          box-shadow: 2px 2px 0 ${t.shadow}; transition: all 0.15s; cursor: pointer;
        }
        .pill-btn:hover { background: ${t.border}; color: ${t.bg}; transform: translate(-1px, -1px); box-shadow: 4px 4px 0 ${t.shadow}; }
        .avatar-image { object-fit: cover; border-radius: 17px; display: block; width: 100%; height: auto; }
      `}</style>

      {/* Controls */}
      <div style={{ position: "absolute", top: 20, right: 28, zIndex: 10, display: "flex", gap: "10px" }}>
        <button onClick={() => setLang(lang === "vi" ? "en" : "vi")} className="pill-btn" style={{ padding: "6px 14px", fontSize: "0.75rem" }}>
          {lang === "vi" ? "EN" : "VI"}
        </button>
        <button onClick={() => setTheme(isDark ? "light" : "dark")} className="pill-btn" style={{ padding: "6px 14px", fontSize: "0.75rem" }}>
          {isDark ? "Light" : "Dark"}
        </button>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "60px 28px" }}>

        {/* ── HERO ── */}
        <div style={{
          textAlign: "center", marginBottom: "60px", padding: "60px 32px 40px", borderRadius: "20px",
          backgroundColor: t.heroBg,
          backgroundImage: `linear-gradient(${isDark ? '#ffffff20' : '#00000010'} 1.5px, transparent 1.5px), linear-gradient(90deg, ${isDark ? '#ffffff20' : '#00000010'} 1.5px, transparent 1.5px)`,
          backgroundSize: "24px 24px",
          border: `2px solid ${t.border}`, boxShadow: `6px 6px 0 ${t.shadow}`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            display: "inline-block", background: t.border, color: t.bg, padding: "6px 18px", borderRadius: "20px",
            fontSize: "0.73rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "24px",
            animation: "badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both",
          }}>
            {labels.badge}
          </div>

          <h1 style={{ fontSize: "clamp(2rem,6vw,3.5rem)", fontWeight: 900, color: t.textPri, margin: "0 0 16px", lineHeight: 1.1 }}>
            {nameWords.map((w, i) => <MagWord key={i} word={w} delay={0.3 + i * 0.1} accent={i === nameWords.length - 1} isDark={isDark} />)}
          </h1>

          <Reveal delay={100}>
            <p style={{ fontSize: "1.05rem", fontWeight: 700, color: t.textPri, margin: "0 0 20px" }}>{hs.vaiTro}</p>
          </Reveal>

          <Reveal delay={150}>
            <p style={{ margin: "0 auto 32px", fontSize: "0.95rem", color: t.textSec, maxWidth: "600px", lineHeight: 1.7, fontWeight: 500 }}>
              {hs.gioiThieu}
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginBottom: "40px" }}>
              <button onClick={saoEmail} className="pill-btn">✉ {daSao ? labels.copied : hs.email}</button>
              <a href={`https://${hs.facebook}`} target="_blank" rel="noreferrer" className="pill-btn">FB Facebook</a>
            </div>
          </Reveal>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", height: "32px", animation: "fadeUp 0.5s ease 1s both" }}>
            {BARS.map((h, i) => (
              <div key={i} style={{ width: "3px", height: `${h}px`, background: t.border, borderRadius: "2px", opacity: 0.6, animation: `barPulse 1.4s ease-in-out ${i * 0.05}s infinite alternate` }} />
            ))}
          </div>
        </div>

        {/* ── INFO BOX ── */}
        <Reveal>
          <div className="hover-card" style={{ background: t.cardBg, border: `2px solid ${t.border}`, borderRadius: "16px", padding: "28px", marginBottom: "50px", boxShadow: `4px 4px 0 ${t.shadow}`, display: "flex", flexDirection: "row", gap: "32px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flexShrink: 0, position: "relative" }}>
              <div style={{ position: "absolute", inset: "-6px", borderRadius: "20px", background: "linear-gradient(135deg, #4f46e5, #0ea5e9)", filter: "blur(12px)", opacity: 0.5, zIndex: 0 }} />
              <div style={{ position: "relative", zIndex: 1, padding: "3px", borderRadius: "20px", background: t.border, border: `2px solid ${t.border}` }}>
                <Image src={hs.avatar} alt={`Avatar of ${hs.ten}`} width={140} height={140} priority className="avatar-image" />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <Label isDark={isDark}>{labels.employer}</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                {[
                  { label: lang === "vi" ? "Ngày sinh" : "Date of Birth", val: hs.ngaySinh },
                  { label: lang === "vi" ? "Chiều cao" : "Height", val: hs.chieuCao },
                  { label: lang === "vi" ? "Vị trí ứng tuyển" : "Position", val: lang === "vi" ? "Thực tập sinh Kỹ thuật" : "Engineering Intern" },
                  { label: lang === "vi" ? "Thời gian bắt đầu" : "Start Time", val: lang === "vi" ? "Ngay lập tức" : "Immediately" },
                  { label: lang === "vi" ? "Nơi làm việc" : "Location", val: lang === "vi" ? "Phú Quốc " : "Phu Quoc" },
                  { label: "GPA", val: hs.hocVan.gpa },
                  { label: lang === "vi" ? "Ngoại ngữ" : "Language", val: "VSTEP B1" },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: t.textMut, textTransform: "uppercase", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: t.textPri }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── SKILLS ── */}
        <div style={{ marginBottom: "50px" }}>
          <Reveal><Label isDark={isDark}>{labels.skills}</Label></Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {[
              { t: lang === "vi" ? "Điện Dân Dụng" : "Residential Electrical", d: hs.kyNang.dienDanDung, bgLight: "#fee2e2", bgDark: "#7f1d1d" },
              { t: lang === "vi" ? "Thi công – Lắp đặt" : "Installation & Construction", d: hs.kyNang.thiCong, bgLight: "#e0e7ff", bgDark: "#3730a3" },
              { t: lang === "vi" ? "Kỹ năng Khách sạn" : "Hotel Operations", d: hs.kyNang.khachSan, bgLight: "#dcfce7", bgDark: "#14532d" },
              { t: lang === "vi" ? "Kỹ năng Mềm" : "Soft Skills", d: hs.kyNang.mem, bgLight: "#f3e8ff", bgDark: "#581c87" },
            ].map((g, i) => (
              <Reveal key={i} delay={i * 50}>
                <div className="hover-card" style={{ background: isDark ? g.bgDark : g.bgLight, border: `2px solid ${t.border}`, borderRadius: "12px", padding: "20px", boxShadow: `3px 3px 0 ${t.shadow}`, height: "100%" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: "12px", color: isDark ? "#fff" : "#000" }}>{g.t}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {g.d.map((tag, j) => (
                      <span key={j} style={{ background: t.cardBg, border: `1.5px solid ${t.border}`, borderRadius: "6px", padding: "4px 10px", fontSize: "0.75rem", fontWeight: 700, color: t.textPri, boxShadow: `1px 1px 0 ${t.shadow}` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ── EXPERIENCE (dùng lại section duAn với label mới) ── */}
        <div style={{ marginBottom: "50px" }}>
          <Reveal><Label isDark={isDark}>{labels.experience}</Label></Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {hs.duAn.map((p, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="hover-card" style={{ background: isDark ? p.bgDark : p.bgLight, border: `2px solid ${t.border}`, borderRadius: "16px", padding: "24px", boxShadow: `4px 4px 0 ${t.shadow}`, position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, height: "4px", width: "100%", background: p.tag, borderTopLeftRadius: "14px", borderTopRightRadius: "14px" }} />
                  <div onClick={() => setDuAnMo(duAnMo === i ? null : i)} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 900, margin: 0, flex: 1, color: isDark ? "#fff" : "#000" }}>{p.ten}</h3>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: isDark ? "#cbd5e1" : p.tag, width: "24px", textAlign: "center" }}>{duAnMo === i ? "−" : "+"}</div>
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: isDark ? "#cbd5e1" : "#334155", marginBottom: "12px" }}>{p.vaiTro} · {p.thoiGian}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                      {p.stack.map((s, j) => (
                        <span key={j} style={{ background: t.cardBg, border: `1.5px solid ${t.border}`, borderRadius: "6px", padding: "2px 8px", fontSize: "0.7rem", fontWeight: 800, color: t.textPri }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  {duAnMo === i && (
                    <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: `2px dashed ${t.border}` }}>
                      <ul style={{ paddingLeft: "20px", margin: "0 0 20px", fontSize: "0.9rem", color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.6, fontWeight: 500 }}>
                        {p.moTa.map((m, j) => <li key={j} style={{ marginBottom: "8px" }}>{m}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ── EDUCATION & ACHIEVEMENTS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "50px" }}>
          <div>
            <Reveal><Label isDark={isDark}>{labels.education}</Label></Reveal>
            <Reveal>
              <div className="hover-card" style={{ background: t.cardBg, border: `2px solid ${t.border}`, borderRadius: "16px", padding: "24px", boxShadow: `4px 4px 0 ${t.shadow}`, height: "100%" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "6px" }}>{hs.hocVan.truong}</h3>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: t.textMut, marginBottom: "16px" }}>{hs.hocVan.nganh} · {hs.hocVan.thoiGian}</div>
                <div style={{ display: "inline-block", background: isDark ? "#854d0e" : "#fef08a", color: isDark ? "#fff" : "#000", border: `1.5px solid ${t.border}`, padding: "6px 14px", borderRadius: "8px", fontWeight: 800, marginBottom: "16px", boxShadow: `2px 2px 0 ${t.shadow}` }}>
                  GPA: {hs.hocVan.gpa}
                </div>
                <ul style={{ paddingLeft: "18px", fontSize: "0.85rem", color: t.textSec, lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                  {hs.hocVan.noiBat.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            </Reveal>
          </div>

          <div>
            <Reveal><Label isDark={isDark}>{labels.achievements}</Label></Reveal>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {hs.thanhTich.map((tt, i) => (
                <Reveal key={i} delay={i * 50}>
                  <div className="hover-card" style={{ background: isDark ? tt.bgDark : tt.bgLight, border: `2px solid ${t.border}`, borderRadius: "12px", padding: "16px", boxShadow: `3px 3px 0 ${t.shadow}` }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "6px", color: isDark ? "#cbd5e1" : "#334155" }}>{tt.to_chuc} · {tt.nam}</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: isDark ? "#fff" : "#000" }}>{tt.ten}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* ── EXTRAS ── */}
        <Reveal>
          <div style={{ background: t.border, color: t.bg, borderRadius: "16px", padding: "32px", boxShadow: `6px 6px 0 ${isDark ? "#334155" : "#cbd5e1"}` }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: t.bg, opacity: 0.8, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "16px", height: "3px", background: t.bg, flexShrink: 0 }} />
              {labels.extras}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px" }}>
              <div>
                <h4 style={{ fontSize: "1rem", fontWeight: 800, color: t.bg, marginBottom: "16px" }}>{labels.commitments}</h4>
                <ul style={{ paddingLeft: "16px", fontSize: "0.9rem", color: t.bg, opacity: 0.9, lineHeight: 1.7, margin: 0 }}>
                  {hs.themVeToi.map((item, i) => <li key={i} style={{ marginBottom: "8px" }}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h4 style={{ fontSize: "1rem", fontWeight: 800, color: t.bg, marginBottom: "16px" }}>{labels.interests}</h4>
                <ul style={{ paddingLeft: "16px", fontSize: "0.9rem", color: t.bg, opacity: 0.9, lineHeight: 1.7, margin: 0 }}>
                  {hs.soThich.map((s, i) => <li key={i} style={{ marginBottom: "8px" }}>{s}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── SCROLL TO TOP ── */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            style={{
              position: "fixed", bottom: 28, right: 28, width: 48, height: 48, borderRadius: "50%",
              background: t.cardBg, border: `2px solid ${t.border}`, boxShadow: `3px 3px 0 ${t.shadow}`,
              color: t.textPri, fontSize: 20, fontWeight: 900, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.2s, box-shadow 0.2s", zIndex: 10,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `5px 7px 0 ${t.shadow}`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `3px 3px 0 ${t.shadow}`; }}
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}